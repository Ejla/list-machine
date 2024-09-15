import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreVertical, Circle, CheckCircle } from "lucide-react";
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

export const ListItem = ({ item, onToggle, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.text);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const inputRef = useRef(null);
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    onEdit(item.id, editedText);
    setIsEditing(false);
  };

  const handleClickOutside = (e) => {
    if (isEditing && inputRef.current && !inputRef.current.contains(e.target)) {
      setShowConfirmDialog(true);
    }
  };

  useEffect(() => {
    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isEditing]);

  const handleCancelEdit = () => {
    setShowConfirmDialog(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  useEffect(() => {
    if (showConfirmDialog) {
      setTimeout(() => {
        cancelButtonRef.current?.focus();
      }, 0);
    }
  }, [showConfirmDialog]);

  return (
    <>
      <li className="flex items-center justify-between bg-secondary p-2 rounded">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(item.id)}
            className="p-0"
          >
            {item.done ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>
          {isEditing ? (
            <Input
              ref={inputRef}
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSave()}
              className="max-w-[200px]"
            />
          ) : (
            <span
              onClick={() => setIsEditing(true)}
              className={`cursor-pointer ${
                item.done ? "line-through text-muted-foreground" : ""
              }`}
            >
              {item.text}
            </span>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(item.id)}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </li>
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave without saving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel ref={cancelButtonRef} onClick={handleCancelEdit}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsEditing(false);
              setEditedText(item.text);
              setShowConfirmDialog(false);
            }}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

ListItem.propTypes = {
  item: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

ListItem.displayName = "ListItem";
