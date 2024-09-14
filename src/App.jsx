import { useState, useEffect } from "react";

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

export default function App() {
  const [lists, setLists] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedList, setSelectedList] = useState(null);
  const [newItem, setNewItem] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    const storedLists = localStorage.getItem("lists");
    if (storedLists) {
      try {
        const parsedLists = JSON.parse(storedLists);
        setLists(parsedLists);
      } catch (error) {
        console.error("Error parsing lists from local storage:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (lists.length > 0) {
      localStorage.setItem("lists", JSON.stringify(lists));
    }
  }, [lists]);

  const handleCreateList = () => {
    if (newListName.trim()) {
      const newList = { id: Date.now(), name: newListName.trim(), items: [] };
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

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Left column */}
      <div className="w-[300px] p-4 border-r border-border">
        <h1 className="text-2xl font-bold mb-4">ListMachine</h1>
        <Button onClick={() => setIsModalOpen(true)} className="w-full mb-4">
          Create New List
        </Button>
        <ScrollArea className="h-[calc(100vh-140px)]">
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
        </ScrollArea>
      </div>

      {/* Right column */}
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
        }}
      />

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
    </div>
  );
}
