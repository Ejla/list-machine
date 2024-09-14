import { useState } from "react";
import PropTypes from "prop-types";

import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

export const ListItem = ({ item, onToggle, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(item.text);

  const handleEdit = () => {
    onEdit(item.id, editedText);
    setIsEditing(false);
  };

  return (
    <li className="flex items-center justify-between bg-secondary p-2 rounded">
      <div className="flex items-center space-x-2">
        <Checkbox
          checked={item.done}
          onCheckedChange={() => onToggle(item.id)}
          id={`item-${item.id}`}
        />
        {isEditing ? (
          <Input
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleEdit}
            onKeyPress={(e) => e.key === "Enter" && handleEdit()}
            className="max-w-[200px]"
          />
        ) : (
          <label
            htmlFor={`item-${item.id}`}
            className={`${
              item.done ? "line-through text-muted-foreground" : ""
            }`}
          >
            {item.text}
          </label>
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
  );
};

ListItem.propTypes = {
  item: PropTypes.object.isRequired,
  onToggle: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

ListItem.displayName = "ListItem";
