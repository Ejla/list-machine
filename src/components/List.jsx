import { useRef, useEffect, useState } from 'react';
import PropTypes from "prop-types";
import { MoreVertical, Pin, PinOff, Pencil, Trash2, SquareStack, CheckSquare, Square, X, ListPlus, MoveVertical } from "lucide-react";
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

  const handleNewListWithSelection = () => {
    setIsNewListModalOpen(true);
  };

  const handleCreateNewListWithSelection = () => {
    if (newListWithSelectionName.trim()) {
      const selectedItemsData = selectedList.items.filter(item => selectedItems.includes(item.id));
      const newList = onCreateNewList(newListWithSelectionName.trim(), selectedItemsData);
      
      // Remove selected items from the current list
      const updatedItems = selectedList.items.filter(item => !selectedItems.includes(item.id));
      updateList(updatedItems);

      setIsNewListModalOpen(false);
      setNewListWithSelectionName("");
      setSelectedItems([]);
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

  const updateList = (updatedItems) => {
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
    let updatedLists = [...lists];
    let updatedCurrentList = { ...selectedList };
    let targetListId = selectedList.id;
    let shouldExitEditMultiple = false;

    switch (moveOption) {
      case 'top':
        updatedCurrentList.items = [
          ...itemsToMove,
          ...updatedCurrentList.items.filter(item => !selectedItems.includes(item.id))
        ];
        break;
      case 'bottom':
        updatedCurrentList.items = [
          ...updatedCurrentList.items.filter(item => !selectedItems.includes(item.id)),
          ...itemsToMove
        ];
        break;
      case 'another':
        if (selectedMoveList) {
          targetListId = selectedMoveList;
          updatedLists = updatedLists.map(list => {
            if (list.id === selectedMoveList) {
              return { ...list, items: [...list.items, ...itemsToMove] };
            }
            if (list.id === selectedList.id) {
              return { ...list, items: list.items.filter(item => !selectedItems.includes(item.id)) };
            }
            return list;
          });
          shouldExitEditMultiple = true;
        }
        break;
    }

    if (moveOption !== 'another') {
      updatedLists = updatedLists.map(list => 
        list.id === selectedList.id ? updatedCurrentList : list
      );
    }

    setLists(updatedLists);
    setSelectedList(updatedLists.find(list => list.id === targetListId));
    
    if (shouldExitEditMultiple) {
      setSelectedItems([]);
      setIsEditingMultiple(false);
    } else {
      // If moving within the same list, update selectedItems to reflect new positions
      setSelectedItems(prevSelected => {
        const updatedItems = updatedLists.find(list => list.id === targetListId).items;
        return updatedItems
          .filter(item => prevSelected.includes(item.id))
          .map(item => item.id);
      });
    }

    setIsMoveModalOpen(false);
    setMoveOption(null);
    setSelectedMoveList(null);

    toast({
      title: `${itemsToMove.length} item(s) moved successfully`,
      duration: 3000,
    });
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
                <Button onClick={handleNewListWithSelection} disabled={selectedItems.length === 0}>
                  <ListPlus className="mr-2 h-4 w-4" />
                  New List with Selection
                </Button>
                <Button onClick={handleMove} disabled={selectedItems.length === 0}>
                  <MoveVertical className="mr-2 h-4 w-4" />
                  Move Selected
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
