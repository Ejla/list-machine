import { useState, useEffect, useCallback } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { List } from "./components/List";
import { Lists } from "./components/Lists";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ThemeProvider } from "./components/ThemeProvider"
import { ModeToggle } from "./components/ModeToggle"
import { X, Search } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./components/ui/dialog";

import { ScrollArea } from "./components/ui/scroll-area";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";

import { Toaster } from "./components/ui/toaster";
import { useToast } from "./hooks/use-toast";

export default function App() {
  const [lists, setLists] = useState([]);
  const [selectedList, setSelectedList] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [newItem, setNewItem] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState([]);
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [listToDelete, setListToDelete] = useState(null);
  const [newListCreated, setNewListCreated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handlePinList = useCallback((listId) => {
    setLists(prevLists => {
      const updatedLists = prevLists.map(list => 
        list.id === listId ? { ...list, isPinned: !list.isPinned } : list
      );
      // Update selectedList if it's the one being pinned/unpinned
      if (selectedList && selectedList.id === listId) {
        setSelectedList(updatedLists.find(list => list.id === listId));
      }
      return updatedLists;
    });
  }, [selectedList]);

  useEffect(() => {
    const storedLists = localStorage.getItem("lists");
    const storedSelectedListId = localStorage.getItem("selectedListId");

    if (storedLists) {
      try {
        const parsedLists = JSON.parse(storedLists);
        // Add createdAt to any lists that don't have it
        const updatedLists = parsedLists.map(list => ({
          ...list,
          createdAt: list.createdAt || Date.now()
        }));
        setLists(updatedLists);

        if (storedSelectedListId) {
          const selectedList = updatedLists.find(list => list.id.toString() === storedSelectedListId);
          if (selectedList) {
            setSelectedList(selectedList);
          } else if (updatedLists.length > 0) {
            setSelectedList(updatedLists[0]);
          }
        } else if (updatedLists.length > 0) {
          setSelectedList(updatedLists[0]);
        }
      } catch (error) {
        console.error("Error parsing data from local storage:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (lists.length > 0) {
      localStorage.setItem("lists", JSON.stringify(lists));
    }
  }, [lists]);

  useEffect(() => {
    if (selectedList) {
      localStorage.setItem('selectedListId', selectedList.id.toString());
    }
  }, [selectedList]);

  const handleCreateList = useCallback(() => {
    if (newListName.trim()) {
      const newList = {
        id: Date.now(),
        name: newListName.trim(),
        items: [],
        createdAt: Date.now(),
      };
      const updatedLists = [newList, ...lists];
      setLists(updatedLists);
      setSelectedList(newList);
      setNewListName("");
      setIsModalOpen(false);
      setNewListCreated(true);  // Set this to true when a new list is created
    }
  }, [newListName, lists, setLists, setSelectedList]);

  const handleRenameList = useCallback(() => {
    if (newListName.trim() && selectedList) {
      const updatedLists = lists.map((list) =>
        list.id === selectedList.id
          ? { ...list, name: newListName.trim() }
          : list
      );
      setLists(updatedLists);
      setSelectedList({ ...selectedList, name: newListName.trim() });
      setNewListName("");
      setIsModalOpen(false);
      setIsRenaming(false);
    }
  }, [newListName, selectedList, lists, setLists, setSelectedList]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter") {
      isRenaming ? handleRenameList() : handleCreateList();
    }
  }, [isRenaming, handleRenameList, handleCreateList]);

  const handleDeleteList = useCallback((listId) => {
    const listToDelete = lists.find(list => list.id === listId);
    setListToDelete(listToDelete);
    setIsDeleteConfirmOpen(true);
  }, [lists]);

  const confirmDeleteList = useCallback(() => {
    if (listToDelete) {
      const updatedLists = lists.filter(list => list.id !== listToDelete.id);
      setLists(updatedLists);

      let newSelectedList = null;

      if (updatedLists.length === 0) {
        // If we're deleting the last list
        setSelectedList(null);
        localStorage.removeItem('lists');
        localStorage.removeItem('selectedListId');
      } else if (selectedList && selectedList.id === listToDelete.id) {
        const deletedListIndex = lists.findIndex(list => list.id === listToDelete.id);
        const wasDeletedListPinned = listToDelete.isPinned;

        if (wasDeletedListPinned) {
          // If a pinned list was deleted
          const olderPinnedList = updatedLists.slice(0, deletedListIndex).reverse().find(list => list.isPinned);
          const newerPinnedList = updatedLists.slice(deletedListIndex).find(list => list.isPinned);
          const newestUnpinnedList = updatedLists.filter(list => !list.isPinned).sort((a, b) => b.createdAt - a.createdAt)[0];

          newSelectedList = olderPinnedList || newerPinnedList || newestUnpinnedList;
        } else {
          // If an unpinned list was deleted
          const olderUnpinnedList = updatedLists.slice(0, deletedListIndex).reverse().find(list => !list.isPinned);
          const newerUnpinnedList = updatedLists.slice(deletedListIndex).find(list => !list.isPinned);
          const oldestPinnedList = updatedLists.filter(list => list.isPinned).sort((a, b) => a.createdAt - b.createdAt)[0];

          newSelectedList = olderUnpinnedList || newerUnpinnedList || oldestPinnedList;
        }

        setSelectedList(newSelectedList || null);
      }

      // Update localStorage
      if (updatedLists.length > 0) {
        localStorage.setItem('lists', JSON.stringify(updatedLists));
        if (selectedList && selectedList.id === listToDelete.id) {
          localStorage.setItem('selectedListId', newSelectedList ? newSelectedList.id.toString() : '');
        }
      } else {
        localStorage.removeItem('lists');
        localStorage.removeItem('selectedListId');
      }

      setIsDeleteConfirmOpen(false);
      
      toast({
        title: `List "${listToDelete.name}" was deleted successfully`,
        duration: 3000,
      });
      
      setListToDelete(null);
    }
  }, [listToDelete, lists, selectedList, setLists, setSelectedList, toast]);

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
          
          const newDeletedItems = prevDeletedItems.slice(0, -1);
          if (newDeletedItems.length === 0) {
            toast.dismiss();
          }
          return newDeletedItems;
        }
      }
      return prevDeletedItems;
    });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id && selectedList) {
      const oldIndex = selectedList.items.findIndex(item => item.id === active.id);
      const newIndex = selectedList.items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(selectedList.items, oldIndex, newIndex);
      const updatedList = { ...selectedList, items: newItems };

      setSelectedList(updatedList);
      setLists(prevLists => 
        prevLists.map(list => 
          list.id === selectedList.id ? updatedList : list
        )
      );

      localStorage.setItem('lists', JSON.stringify(lists.map(list => 
        list.id === selectedList.id ? updatedList : list
      )));
    }
  };

  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Left column */}
      <div className="w-[300px] border-r border-border flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">ListMachine</h1>
            <ModeToggle />
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="w-full mb-4">
            Create New List
          </Button>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search lists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-8"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        <Lists 
          lists={lists}
          selectedList={selectedList}
          setSelectedList={setSelectedList}
          searchQuery={searchQuery}
        />
      </div>

      {/* Right column */}
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <List
          {...{
            lists,
            setLists,
            selectedList,
            setSelectedList,
            handlePinList,
            newItem,
            setNewItem,
            setNewListName,
            setIsRenaming,
            setIsModalOpen,
            deletedItems,
            setDeletedItems,
            toast,
            handleDeleteList,
            newListCreated,
            setNewListCreated,
          }}
        />
      </DndContext>

      {/* Modal for creating/renaming list */}
      <Dialog open={isModalOpen} onOpenChange={(open) => {
        setIsModalOpen(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRenaming ? "Rename List" : "Create New List"}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="List Name"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setIsRenaming(false);
                setNewListName("");
              }}
            >
              Cancel
            </Button>
            <Button onClick={isRenaming ? handleRenameList : handleCreateList}>
              {isRenaming ? "Rename" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog for deleting list */}
      <AlertDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the list "{listToDelete?.name}" and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteList}>Yes, delete list</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </div>
    </ThemeProvider>
  );
  
}
