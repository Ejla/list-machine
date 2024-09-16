import React from 'react';
import PropTypes from 'prop-types';
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Pin } from "lucide-react";

export const Lists = ({ lists, selectedList, setSelectedList }) => {
  const pinnedLists = lists.filter(list => list.isPinned);
  const unpinnedLists = lists.filter(list => !list.isPinned);

  const renderListButton = (list) => (
    <Button
      key={list.id}
      variant={selectedList && selectedList.id === list.id ? "secondary" : "ghost"}
      className="w-full justify-start mb-2"
      onClick={() => setSelectedList(list)}
    >
      {list.name}
    </Button>
  );

  return (
    <ScrollArea className="flex-1">
      <div className="p-4">
        {pinnedLists.length > 0 && (
          <>
            <div className="flex items-center mb-2 text-muted-foreground">
              <Pin className="h-4 w-4 mr-2" />
              <span className="text-xs font-semibold">Pinned</span>
            </div>
            {pinnedLists.map(renderListButton)}
            <div className="border-t border-border my-2" />
          </>
        )}
        {unpinnedLists.map(renderListButton)}
      </div>
    </ScrollArea>
  );
};

Lists.propTypes = {
  lists: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      isPinned: PropTypes.bool,
    })
  ).isRequired,
  selectedList: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }),
  setSelectedList: PropTypes.func.isRequired,
};