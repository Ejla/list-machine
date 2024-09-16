import React from 'react';
import PropTypes from 'prop-types';
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Font, Svg, Path } from '@react-pdf/renderer';
import { FileDown } from "lucide-react";
import { DropdownMenuItem } from "./ui/dropdown-menu";

// Register Helvetica font
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/@canvas-fonts/helvetica@1.0.4/Helvetica-Bold.ttf', fontWeight: 'bold' },
  ]
});

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  item: {
    fontSize: 13,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 12,
    height: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#000000',
  },
  itemText: {
    flex: 1,
  },
  checkedText: {
    textDecoration: 'line-through',
    color: '#888888',
  },
});

// Custom Checkbox component
const Checkbox = ({ checked }) => (
  <View style={styles.checkbox}>
    {checked && (
      <Svg width={12} height={12}>
        <Path
          d="M2 6 L5 9 L10 3"
          stroke="#000000"
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    )}
  </View>
);

Checkbox.propTypes = {
  checked: PropTypes.bool.isRequired,
};

// Create PDF Document
const ListPDFDocument = ({ list }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>{list.name}</Text>
      {list.items.map((item) => (
        <View key={item.id} style={styles.item}>
          <Checkbox checked={item.done} />
          <Text style={[styles.itemText, item.done && styles.checkedText]}>
            {item.text}
          </Text>
        </View>
      ))}
    </Page>
  </Document>
);

ListPDFDocument.propTypes = {
  list: PropTypes.shape({
    name: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      text: PropTypes.string.isRequired,
      done: PropTypes.bool.isRequired,
    })).isRequired,
  }).isRequired,
};

export const ListPDFExport = ({ list }) => (
  <PDFDownloadLink
    document={<ListPDFDocument list={list} />}
    fileName={`${list.name}.pdf`}
  >
    {({ blob, url, loading, error }) => (
      <DropdownMenuItem disabled={loading}>
        <FileDown className="mr-2 h-4 w-4" />
        {loading ? 'Loading document...' : 'Export to PDF'}
      </DropdownMenuItem>
    )}
  </PDFDownloadLink>
);

ListPDFExport.propTypes = {
  list: PropTypes.shape({
    name: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      text: PropTypes.string.isRequired,
      done: PropTypes.bool.isRequired,
    })).isRequired,
  }).isRequired,
};
