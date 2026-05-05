'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Dataset } from './types';

interface DatasetContextType {
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;
  datasets: Dataset[];
  setDatasets: (datasets: Dataset[]) => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);

  return (
    <DatasetContext.Provider value={{ dataset, setDataset, datasets, setDatasets }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const context = useContext(DatasetContext);
  if (context === undefined) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}
