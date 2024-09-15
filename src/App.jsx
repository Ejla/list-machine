import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { List } from "./components/List";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList = {
        id: Date.now(),
        name: newListName.trim(),
        items: [],
        createdAt: Date.now(), // Add this line
      };
      const updatedLists = [newList, ...lists];
      setLists(updatedLists);
      setSelectedList(newList);
      setNewListName("");
      setIsModalOpen(false);
    }
  };

  const handleRenameList = () => {
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
  };

  const handleDeleteList = () => {
    if (selectedList) {
      const updatedLists = lists.filter((list) => list.id !== selectedList.id);
      setLists(updatedLists);
      setSelectedList(updatedLists[0] || null);
      setIsDeleteConfirmOpen(false);
    }
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
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      {/* Left column */}
      <div className="w-[300px] border-r border-border flex flex-col">
        <div className="flex-shrink-0 p-4 border-b">
          <h1 className="text-2xl font-bold mb-4">ListMachine</h1>
          <Button onClick={() => setIsModalOpen(true)} className="w-full">
            Create New List
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-4">
            {lists.map((list) => (
              <Button
                key={list.id}
                variant={
                  selectedList && selectedList.id === list.id
                    ? "secondary"
                    : "ghost"
                }
                className="w-full justify-start mb-2"
                onClick={() => setSelectedList(list)}
              >
                {list.name}
              </Button>
            ))}
          </div>
        </ScrollArea>
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
            setIsDeleteConfirmOpen,
            newItem,
            setNewItem,
            setNewListName,
            setIsRenaming,
            setIsModalOpen,
            deletedItems,
            setDeletedItems,
            toast,
          }}
        />
      </DndContext>

      {/* Modal for creating/renaming list */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isRenaming ? "Rename List" : "Create New List"}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            placeholder="List Name"
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
              Are you sure you want to delete this list?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              list and all its items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList}>
              Yes, delete list
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </div>
  );
}
