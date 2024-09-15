import React from 'react';
import PropTypes from 'prop-types';
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";

export const Lists = ({ lists, selectedList, setSelectedList }) => {
  return (
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
  );
};

Lists.propTypes = {
  lists: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  selectedList: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }),
  setSelectedList: PropTypes.func.isRequired,
};