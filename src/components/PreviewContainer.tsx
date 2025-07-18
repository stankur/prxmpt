import { PreviewItem } from './PreviewItem';

interface PreviewContainerProps {
  items: Record<string, unknown>[];
}

export const PreviewContainer: React.FC<PreviewContainerProps> = ({
  items
}) => {
  return (
    <div>
      <div className="mb-4 flex justify-center">
        <h3 className="text-sm font-medium opacity-50">
          Preview - When you add inputs, it will display like this:
        </h3>
      </div>
      <div className="relative">
        <div className="space-y-3">
          {items.map((item, index) => {
            return (
              <PreviewItem
                key={index}
                item={item}
                index={index}
                isExpanded={true}
                onToggleExpand={() => {}}
              />
            );
          })}
        </div>
        {/* Smooth fade gradient overlay */}
        <div className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none" 
             style={{
               background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.65) 25%, rgba(0,0,0,0.7) 50%, rgba(0,0,0,0.8) 75%, rgba(0,0,0,0.8) 100%)'
             }} />
      </div>
    </div>
  );
};
