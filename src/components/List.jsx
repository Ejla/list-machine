import { useRef, useEffect } from 'react';
import PropTypes from "prop-types";
import { MoreVertical, Pin, PinOff, Pencil, Trash2 } from "lucide-react";
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { formatDistanceToNow } from 'date-fns';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { ListItem } from "./ListItem";

export const List = ({
  lists,
  setLists,
  selectedList,
  setSelectedList,
  handlePinList,
  shouldFocusAddItem,
  setShouldFocusAddItem,
  setIsDeleteConfirmOpen,
  newItem,
  setNewItem,
  setNewListName,
  setIsRenaming,
  setIsModalOpen,
  deletedItems,
  setDeletedItems,
  toast,
}) => {
  const listItemsRef = useRef(null);
  const addItemInputRef = useRef(null);
  const toastIdRef = useRef(null);

  useEffect(() => {
    if (shouldFocusAddItem && addItemInputRef.current) {
      addItemInputRef.current.focus();
      setShouldFocusAddItem(false);
    }
  }, [shouldFocusAddItem, setShouldFocusAddItem]);

  useEffect(() => {
    if (deletedItems.length > 0) {
      const undoCount = deletedItems.length;
      toastIdRef.current = Date.now();
      toast({
        id: toastIdRef.current,
        title: `${undoCount} item${undoCount > 1 ? 's' : ''} deleted`,
        action: (
          <Button variant="outline" size="sm" onClick={handleUndoDelete}>
            Undo
          </Button>
        ),
      });
    } else if (toastIdRef.current) {
      // Dismiss the toast when there are no more deleted items
      toast({
        id: toastIdRef.current,
        title: "All deletions undone",
        duration: 2000, // Show this message briefly
      });
      toastIdRef.current = null;
    }
  }, [deletedItems, toast]);

  useEffect(() => {
    if (selectedList && !selectedList.createdAt) {
      const updatedList = { ...selectedList, createdAt: Date.now() };
      setSelectedList(updatedList);
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === selectedList.id ? updatedList : list
        )
      );
    }
  }, [selectedList, setSelectedList, setLists]);

  const handleAddItem = () => {
    if (newItem.trim() && selectedList) {
      const newItemObject = {
        id: Date.now(),
        text: newItem.trim(),
        done: false,
      };
      const updatedLists = lists.map((list) =>
        list.id === selectedList.id
          ? { ...list, items: [...list.items, newItemObject] }
          : list
      );
      setLists(updatedLists);
      setSelectedList({
        ...selectedList,
        items: [...selectedList.items, newItemObject],
      });
      setNewItem("");

      // Scroll to bottom after adding new item
      setTimeout(() => {
        if (listItemsRef.current) {
          listItemsRef.current.scrollTop = listItemsRef.current.scrollHeight;
        }
      }, 0);
    }
  };

  const openRenameModal = () => {
    setNewListName(selectedList.name);
    setIsRenaming(true);
    setIsModalOpen(true);
  };

  const handleToggleItem = (itemId) => {
    const updatedLists = lists.map((list) =>
      list.id === selectedList.id
        ? {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, done: !item.done } : item
            ),
          }
        : list
    );
    setLists(updatedLists);
    setSelectedList(updatedLists.find((list) => list.id === selectedList.id));
  };

  const handleEditItem = (itemId, newText) => {
    const updatedLists = lists.map((list) =>
      list.id === selectedList.id
        ? {
            ...list,
            items: list.items.map((item) =>
              item.id === itemId ? { ...item, text: newText } : item
            ),
          }
        : list
    );
    setLists(updatedLists);
    setSelectedList(updatedLists.find((list) => list.id === selectedList.id));
  };

  const handleDeleteItem = (itemId) => {
    const itemIndex = selectedList.items.findIndex((item) => item.id === itemId);
    const deletedItem = selectedList.items[itemIndex];

    setLists((prevLists) => {
      const updatedLists = prevLists.map((list) =>
        list.id === selectedList.id
          ? {
              ...list,
              items: list.items.filter((item) => item.id !== itemId),
            }
          : list
      );
      setSelectedList(updatedLists.find((list) => list.id === selectedList.id));
      return updatedLists;
    });

    setDeletedItems((prevDeletedItems) => [
      ...prevDeletedItems,
      { listId: selectedList.id, index: itemIndex, item: deletedItem },
    ]);
  };

  const handleUndoDelete = () => {
    setDeletedItems((prevDeletedItems) => {
      if (prevDeletedItems.length > 0 && selectedList) {
        const lastDeletedItem = prevDeletedItems[prevDeletedItems.length - 1];
        if (lastDeletedItem.listId === selectedList.id) {
          setLists((prevLists) => {
            const updatedLists = prevLists.map((list) =>
              list.id === selectedList.id
                ? {
                    ...list,
                    items: [
                      ...list.items.slice(0, lastDeletedItem.index),
                      lastDeletedItem.item,
                      ...list.items.slice(lastDeletedItem.index),
                    ],
                  }
                : list
            );
            setSelectedList(updatedLists.find((list) => list.id === selectedList.id));
            return updatedLists;
          });
          
          return prevDeletedItems.slice(0, -1);
        }
      }
      return prevDeletedItems;
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleAddItem();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {selectedList && (
        <>
          <div className="flex-shrink-0 bg-background z-10 p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">{selectedList.name}</h2>
                <span className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(selectedList.createdAt || Date.now()), { addSuffix: true })}
                </span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={openRenameModal}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePinList(selectedList.id)}>
                    {selectedList.isPinned ? (
                      <>
                        <PinOff className="mr-2 h-4 w-4" />
                        Unpin List
                      </>
                    ) : (
                      <>
                        <Pin className="mr-2 h-4 w-4" />
                        Pin List
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteConfirmOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete List
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex gap-2">
              <Input
                ref={addItemInputRef}
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Add new item"
              />
              <Button onClick={handleAddItem}>Add</Button>
            </div>
          </div>
          <div ref={listItemsRef} className="flex-1 overflow-y-auto p-4">
            <SortableContext 
              items={selectedList.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              {selectedList.items.map((item) => (
                <ListItem
                  key={item.id}
                  id={item.id}
                  item={item}
                  onToggle={handleToggleItem}
                  onEdit={handleEditItem}
                  onDelete={handleDeleteItem}
                />
              ))}
            </SortableContext>
          </div>
        </>
      )}
    </div>
  );
};

List.displayName = "List";
List.propTypes = {
  selectedList: PropTypes.object,
  setSelectedList: PropTypes.func,
  lists: PropTypes.array,
  setLists: PropTypes.func,
  openRenameModal: PropTypes.func,
  setIsDeleteConfirmOpen: PropTypes.func,
  newItem: PropTypes.string,
  setNewItem: PropTypes.func,
  handleAddItem: PropTypes.func,
  handleToggleItem: PropTypes.func,
  handleEditItem: PropTypes.func,
  handleDeleteItem: PropTypes.func,
  setIsModalOpen: PropTypes.func,
  setNewListName: PropTypes.func,
  setIsRenaming: PropTypes.func,
  deletedItems: PropTypes.array.isRequired,
  setDeletedItems: PropTypes.func.isRequired,
  toast: PropTypes.func.isRequired,
  shouldFocusAddItem: PropTypes.bool.isRequired,
  setShouldFocusAddItem: PropTypes.func.isRequired,
  handlePinList: PropTypes.func.isRequired,
};
