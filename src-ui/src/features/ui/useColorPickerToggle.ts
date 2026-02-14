import { useState } from "react";

export function useColorPickerToggle() {
  const [openColorFieldId, setOpenColorFieldId] = useState<string | null>(null);

  const onColorInputBlur = (fieldId: string) => {
    if (openColorFieldId === fieldId) {
      setOpenColorFieldId(null);
    }
  };

  const toggleColorField = (fieldId: string, input: HTMLInputElement | null) => {
    if (!input) {
      return;
    }
    if (openColorFieldId === fieldId) {
      setOpenColorFieldId(null);
      input.blur();
      return;
    }
    setOpenColorFieldId(fieldId);
    if ("showPicker" in input && typeof input.showPicker === "function") {
      input.showPicker();
    } else {
      input.click();
    }
  };

  return {
    openColorFieldId,
    onColorInputBlur,
    toggleColorField,
  };
}
