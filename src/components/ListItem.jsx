import { useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreVertical, GripVertical, Circle, CheckCircle, Check } from "lucide-react";
import { Checkbox } from "./ui/checkbox";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
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


export const ListItem = ({ 
  id, 
  item, 
  onToggle, 
  onEdit, 
  onDelete, 
  toast, 
  isEditingMultiple,
  isSelected,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.text);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const inputRef = useRef(null);
  const saveButtonRef = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editedText.trim().length > 0) {
      onEdit(item.id, editedText.trim());
      setIsEditing(false);
    } else {
      toast({
        title: "Item text cannot be empty",
        description: "Please enter at least one character.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    if (newValue.trim().length > 0 || newValue === '') {
      setEditedText(newValue);
    }
  };

  const handleCancelEdit = () => {
    setTimeout(() => {
      if (document.activeElement !== saveButtonRef.current) {
        if (editedText !== item.text) {
          setIsAlertOpen(true);
        } else {
          setIsEditing(false);
        }
      }
    }, 0);
  };

  const handleConfirmCancel = () => {
    setEditedText(item.text);
    setIsEditing(false);
    setIsAlertOpen(false);
  };

  const handleContinueEditing = () => {
    setIsAlertOpen(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  return (
    <>
      <li
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`flex items-center justify-between  p-2 rounded mb-2`}
      >
        <div className="flex items-center space-x-2 flex-grow">
          {isEditingMultiple ? (
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => onSelect(id)}
              className="mr-2"
            />
          ) : (
            <div {...listeners}>
              <GripVertical className="h-5 w-5 text-gray-400 cursor-grab" />
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => !isEditing && !isEditingMultiple && onToggle(item.id)}
            className={`p-0 ${(isEditing || isEditingMultiple) ? 'cursor-not-allowed opacity-50' : ''}`}
            disabled={isEditing || isEditingMultiple}
          >
            {item.done ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <Circle className="h-5 w-5" />
            )}
          </Button>
          {isEditing ? (
            <div className="flex items-center space-x-2 flex-grow">
              <Input
                ref={inputRef}
                value={editedText}
                onChange={handleInputChange}
                onKeyPress={(e) => e.key === "Enter" && handleSave()}
                onBlur={handleCancelEdit}
                className="flex-grow"
              />
              <Button 
                ref={saveButtonRef}
                size="sm" 
                onClick={handleSave}
                disabled={editedText.trim().length === 0}
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <span
              onClick={() => !isEditingMultiple && setIsEditing(true)}
              className={`cursor-pointer ${
                item.done ? "line-through text-muted-foreground" : ""
              } ${isEditingMultiple ? 'pointer-events-none' : ''}`}
            >
              {item.text}
            </span>
          )}
        </div>
        {!isEditing && !isEditingMultiple && (
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
        )}
      </li>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave without saving your changes?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleContinueEditing}>No, continue editing</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>Yes, discard changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

ListItem.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  item: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  toast: PropTypes.func.isRequired,
  isEditingMultiple: PropTypes.bool.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

ListItem.displayName = "ListItem";
