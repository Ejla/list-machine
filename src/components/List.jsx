import { useRef, useEffect } from 'react';
import PropTypes from "prop-types";
import { MoreVertical } from "lucide-react";

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
  const toastIdRef = useRef(null);

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
    <div className="flex-1 p-4">
      {selectedList && (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{selectedList.name}</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={openRenameModal}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteConfirmOpen(true)}>
                  Delete List
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-2 mb-4">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add new item"
            />
            <Button onClick={handleAddItem}>Add</Button>
          </div>
          <ul className="space-y-2">
            {selectedList.items.map((item) => (
              <ListItem
                key={item.id}
                item={item}
                onToggle={handleToggleItem}
                onEdit={handleEditItem}
                onDelete={handleDeleteItem}
              />
            ))}
          </ul>
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
};
