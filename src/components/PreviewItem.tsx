import { InputItem } from './InputItem';

interface PreviewItemProps {
  item: Record<string, unknown>;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export const PreviewItem: React.FC<PreviewItemProps> = ({ 
  item, 
  index, 
  isExpanded, 
  onToggleExpand 
}) => {
  return (
    <InputItem
      item={item}
      index={index}
      isPreview={true}
      isExpanded={isExpanded}
      onToggleExpand={onToggleExpand}
    />
  );
};