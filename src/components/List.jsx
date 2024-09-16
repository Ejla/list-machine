import { useRef, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import { MoreVertical, Pin, PinOff, Pencil, Trash2, SquareStack, CheckSquare, Square, X } from "lucide-react";
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
import { Checkbox } from "./ui/checkbox";

import { ListItem } from "./ListItem";
import { ListPDFExport } from "./ListPDF";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

export const List = ({
  lists,
  setLists,
  selectedList,
  setSelectedList,
  handlePinList,
  setIsDeleteConfirmOpen,
  newItem,
  setNewItem,
  setNewListName,
  setIsRenaming,
  setIsModalOpen,
  deletedItems,
  setDeletedItems,
  toast,
  newListCreated,
  setNewListCreated,
  handleDeleteList,
  isEditingMultiple,
  setIsEditingMultiple,
}) => {
  const listItemsRef = useRef(null);
  const toastIdRef = useRef(null);
  const newItemInputRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

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

  useEffect(() => {
    if (newListCreated) {
      setNewListCreated(false);
    }
  }, [newListCreated, setNewListCreated]);

  useEffect(() => {
    if (newListCreated && newItemInputRef.current) {
      newItemInputRef.current.focus();
      setNewListCreated(false);  // Reset the flag
    }
  }, [newListCreated, setNewListCreated]);

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

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedItems(selectedList.items.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const isAllSelected = selectedList && selectedItems.length === selectedList.items.length;

  const handleConfirmAction = () => {
    if (confirmAction) {
      confirmAction.action();
      setIsConfirmDialogOpen(false);
      setConfirmAction(null);
    }
  };

  const handleDeleteSelected = () => {
    setConfirmAction({
      title: "Delete Selected Items",
      description: `Are you sure you want to delete ${selectedItems.length} item(s)?`,
      action: () => {
        const updatedItems = selectedList.items.filter(item => !selectedItems.includes(item.id));
        updateList(updatedItems);
        toast({
          title: `${selectedItems.length} item(s) deleted successfully`,
          duration: 3000,
        });
        setSelectedItems([]);
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const handleMarkAsDone = () => {
    setConfirmAction({
      title: "Mark Items as Done",
      description: `Are you sure you want to mark ${selectedItems.length} item(s) as done?`,
      action: () => {
        const updatedItems = selectedList.items.map(item => 
          selectedItems.includes(item.id) ? { ...item, done: true } : item
        );
        updateList(updatedItems);
        toast({
          title: `${selectedItems.length} item(s) marked as done`,
          duration: 3000,
        });
        setSelectedItems([]);
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const handleMarkAsNotDone = () => {
    setConfirmAction({
      title: "Mark Items as Not Done",
      description: `Are you sure you want to mark ${selectedItems.length} item(s) as not done?`,
      action: () => {
        const updatedItems = selectedList.items.map(item => 
          selectedItems.includes(item.id) ? { ...item, done: false } : item
        );
        updateList(updatedItems);
        toast({
          title: `${selectedItems.length} item(s) marked as not done`,
          duration: 3000,
        });
        setSelectedItems([]);
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const updateList = (updatedItems) => {
    const updatedList = { ...selectedList, items: updatedItems };
    setSelectedList(updatedList);
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === selectedList.id ? updatedList : list
      )
    );
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
              {isEditingMultiple ? (
                <Button onClick={() => setIsEditingMultiple(false)}>
                  Done Editing
                </Button>
              ) : (
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
                    <DropdownMenuItem onClick={() => setIsEditingMultiple(true)}>
                      <SquareStack className="mr-2 h-4 w-4" />
                      Edit Multiple Items
                    </DropdownMenuItem>
                    <ListPDFExport list={selectedList} />
                    <DropdownMenuItem onClick={() => handleDeleteList(selectedList.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete List
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {isEditingMultiple ? (
              <div className="flex items-center space-x-4 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Select All
                  </label>
                </div>
                <Button onClick={handleDeleteSelected} disabled={selectedItems.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
                <Button onClick={handleMarkAsDone} disabled={selectedItems.length === 0}>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Mark as Done
                </Button>
                <Button onClick={handleMarkAsNotDone} disabled={selectedItems.length === 0}>
                  <Square className="mr-2 h-4 w-4" />
                  Mark as Not Done
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  ref={newItemInputRef}
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add new item"
                  className="mb-4"
                />
                <Button onClick={handleAddItem}>Add</Button>
              </div>
            )}
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
                  toast={toast}
                  isEditingMultiple={isEditingMultiple}
                  isSelected={selectedItems.includes(item.id)}
                  onSelect={handleSelectItem}
                />
              ))}
            </SortableContext>
          </div>
        </>
      )}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsConfirmDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
  newListCreated: PropTypes.bool.isRequired,
  setNewListCreated: PropTypes.func.isRequired,
  handleDeleteList: PropTypes.func.isRequired,
  isEditingMultiple: PropTypes.bool.isRequired,
  setIsEditingMultiple: PropTypes.func.isRequired,
};
