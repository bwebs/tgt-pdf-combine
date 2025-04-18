import {
  Box,
  Button,
  FieldText,
  Heading,
  SpaceVertical,
} from "@looker/components";
import React, { useEffect, useState } from "react";
import { useBoolean } from "usehooks-ts";
import { useExtensionContext } from "./App";

export const ITEMS = {
  pdf_combiner_url: "pdf_combiner_url",
};

const Config: React.FC = () => {
  const [data, setData] = useState<any>({});
  const saved = useBoolean(false);
  const loading = useBoolean(true);

  const { extensionSDK } = useExtensionContext();
  const updateData = (key: string, value: any) => {
    setData({ ...data, [key]: value });
  };

  useEffect(() => {
    const fetchData = async () => {
      const data = await extensionSDK.getContextData();
      setData(data);
      loading.setFalse();
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (saved.value) {
      setTimeout(() => {
        saved.setFalse();
      }, 3000);
    }
  }, [saved.value]);

  if (loading.value) {
    return <div>Loading...</div>;
  } else {
    return (
      <Box p="medium">
        <SpaceVertical maxWidth="400px">
          <Heading as="h2">PDF Combiner</Heading>
          <FieldText
            label="PDF Combiner URL"
            value={data[ITEMS.pdf_combiner_url]}
            onChange={(e: any) =>
              updateData(ITEMS.pdf_combiner_url, e.target.value)
            }
          />
          <Button
            onClick={async () => {
              await extensionSDK.saveContextData(data);
              saved.setTrue();
            }}
          >
            Save
          </Button>
          {saved.value && (
            <Box color="positive" fontSize="small">
              Settings saved successfully
            </Box>
          )}
        </SpaceVertical>
      </Box>
    );
  }
};

export default Config;
