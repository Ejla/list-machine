import { useRef, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import { MoreVertical, Pin, PinOff, Pencil, Trash2, SquareStack, CheckSquare, Square, X, ListPlus, MoveVertical, ChevronDown } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

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

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";

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
  onCreateNewList,
}) => {
  const listItemsRef = useRef(null);
  const toastIdRef = useRef(null);
  const newItemInputRef = useRef(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [isNewListModalOpen, setIsNewListModalOpen] = useState(false);
  const [newListWithSelectionName, setNewListWithSelectionName] = useState("");
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveOption, setMoveOption] = useState(null);
  const [selectedMoveList, setSelectedMoveList] = useState(null);
  const [isAllSelected, setIsAllSelected] = useState(false);

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
      setIsAllSelected(true);
    } else {
      setSelectedItems([]);
      setIsAllSelected(false);
    }
  };

  useEffect(() => {
    // Update isAllSelected when selectedItems changes
    setIsAllSelected(selectedList && selectedItems.length === selectedList.items.length);
  }, [selectedItems, selectedList]);

  const resetSelection = () => {
    setSelectedItems([]);
    setIsAllSelected(false);
  };

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
        updateSelectedList(updatedItems);
        toast({
          title: `${selectedItems.length} item(s) deleted successfully`,
          duration: 3000,
        });
        resetSelection();
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
        updateSelectedList(updatedItems);
        toast({
          title: `${selectedItems.length} item(s) marked as done`,
          duration: 3000,
        });
        resetSelection();
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
        updateSelectedList(updatedItems);
        toast({
          title: `${selectedItems.length} item(s) marked as not done`,
          duration: 3000,
        });
        resetSelection();
      }
    });
    setIsConfirmDialogOpen(true);
  };

  const handleNewListWithSelection = () => {
    setIsNewListModalOpen(true);
  };

  const handleCreateNewListWithSelection = () => {
    if (newListWithSelectionName.trim()) {
      const selectedItemsData = selectedList.items.filter(item => selectedItems.includes(item.id));
      const newList = onCreateNewList(newListWithSelectionName.trim(), selectedItemsData);
      
      // Remove selected items from the current list
      const updatedItems = selectedList.items.filter(item => !selectedItems.includes(item.id));
      updateSelectedList(updatedItems);

      setIsNewListModalOpen(false);
      setNewListWithSelectionName("");
      resetSelection();
      setIsEditingMultiple(false);
      setSelectedList(newList);  // Select the newly created list

      toast({
        title: `New list "${newListWithSelectionName}" created with ${selectedItemsData.length} item(s)`,
        description: "Selected items have been moved to the new list.",
        duration: 3000,
      });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateNewListWithSelection();
    }
  };

  const updateSelectedList = (updatedItems) => {
    const updatedList = { ...selectedList, items: updatedItems };
    setSelectedList(updatedList);
    setLists(prevLists => 
      prevLists.map(list => 
        list.id === selectedList.id ? updatedList : list
      )
    );
  };

  const handleMove = () => {
    setIsMoveModalOpen(true);
  };

  const handleConfirmMove = () => {
    const itemsToMove = selectedList.items.filter(item => selectedItems.includes(item.id));
    let updatedItems = [...selectedList.items];
    
    switch (moveOption) {
      case 'top':
        updatedItems = [
          ...itemsToMove,
          ...updatedItems.filter(item => !selectedItems.includes(item.id))
        ];
        break;
      case 'bottom':
        updatedItems = [
          ...updatedItems.filter(item => !selectedItems.includes(item.id)),
          ...itemsToMove
        ];
        break;
      case 'another':
        if (selectedMoveList) {
          // Handle moving to another list
          // ... existing code for moving to another list ...
          resetSelection();
          setIsEditingMultiple(false);
          return;
        }
        break;
    }

    updateSelectedList(updatedItems);
    setIsMoveModalOpen(false);
    setMoveOption(null);
    setSelectedMoveList(null);
    resetSelection();

    toast({
      title: `${itemsToMove.length} item(s) moved successfully`,
      duration: 3000,
    });
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden`}>
      {selectedList && (
        <>
          <div className="flex-shrink-0 z-10 p-4 border-b">
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
              <div className="flex flex-col space-y-2 mt-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                  />
                  <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant={selectedItems.length > 0 ? "default" : "secondary"}>
                      Select Actions <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={handleDeleteSelected} disabled={selectedItems.length === 0}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMarkAsDone} disabled={selectedItems.length === 0}>
                      <CheckSquare className="mr-2 h-4 w-4" />
                      Mark as Done
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMarkAsNotDone} disabled={selectedItems.length === 0}>
                      <Square className="mr-2 h-4 w-4" />
                      Mark as Not Done
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleNewListWithSelection} disabled={selectedItems.length === 0}>
                      <ListPlus className="mr-2 h-4 w-4" />
                      New List with Selection
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleMove} disabled={selectedItems.length === 0}>
                      <MoveVertical className="mr-2 h-4 w-4" />
                      Move Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                  
                </div>
                
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
      
      <Dialog open={isNewListModalOpen} onOpenChange={setIsNewListModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List with Selection</DialogTitle>
          </DialogHeader>
          <Input
            value={newListWithSelectionName}
            onChange={(e) => setNewListWithSelectionName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="New List Name"
            className="mt-4"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsNewListModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateNewListWithSelection} disabled={!newListWithSelectionName.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveModalOpen} onOpenChange={setIsMoveModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move Selected Items</DialogTitle>
          </DialogHeader>
          <RadioGroup onValueChange={setMoveOption} value={moveOption}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="top" id="top" />
              <label htmlFor="top">Move to Top</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bottom" id="bottom" />
              <label htmlFor="bottom">Move to Bottom</label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="another" id="another" />
              <label htmlFor="another">Move to Another List</label>
            </div>
          </RadioGroup>
          {moveOption === 'another' && (
            <Select onValueChange={setSelectedMoveList} value={selectedMoveList}>
              <SelectTrigger>
                <SelectValue placeholder="Select a list" />
              </SelectTrigger>
              <SelectContent>
                {lists.filter(list => list.id !== selectedList.id).map(list => (
                  <SelectItem key={list.id} value={list.id}>{list.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleConfirmMove} 
              disabled={!moveOption || (moveOption === 'another' && !selectedMoveList)}
            >
              Move
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

List.displayName = "List";
List.propTypes = {
  lists: PropTypes.array.isRequired,
  setLists: PropTypes.func.isRequired,
  selectedList: PropTypes.object,
  setSelectedList: PropTypes.func.isRequired,
  handlePinList: PropTypes.func.isRequired,
  setIsDeleteConfirmOpen: PropTypes.func.isRequired,
  newItem: PropTypes.string.isRequired,
  setNewItem: PropTypes.func.isRequired,
  setNewListName: PropTypes.func.isRequired,
  setIsRenaming: PropTypes.func.isRequired,
  setIsModalOpen: PropTypes.func.isRequired,
  deletedItems: PropTypes.array.isRequired,
  setDeletedItems: PropTypes.func.isRequired,
  toast: PropTypes.func.isRequired,
  newListCreated: PropTypes.bool.isRequired,
  setNewListCreated: PropTypes.func.isRequired,
  handleDeleteList: PropTypes.func.isRequired,
  isEditingMultiple: PropTypes.bool.isRequired,
  setIsEditingMultiple: PropTypes.func.isRequired,
  onCreateNewList: PropTypes.func.isRequired,
};
