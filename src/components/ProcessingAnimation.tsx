import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingAnimationProps {
  inputCount: number;
  promptCount: number;
  isAnimating: boolean;
}

interface Connection {
  id: string;
  inputIndex: number;
  promptIndex: number;
  startPos: { x: number; y: number };
  endPos: { x: number; y: number };
}

export function ProcessingAnimation({ inputCount, promptCount, isAnimating }: ProcessingAnimationProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeBeams, setActiveBeams] = useState<Set<string>>(new Set());
  const inputRefs = useRef<(HTMLDivElement | null)[]>([]);
  const promptRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!isAnimating) return;

    // Wait for DOM elements to be rendered
    setTimeout(() => {
      const newConnections: Connection[] = [];
      
      // Get container reference once
      const containerElement = inputRefs.current[0]?.closest('.relative');
      if (!containerElement) return;
      
      const containerRect = containerElement.getBoundingClientRect();
      
      // Create main input-to-prompt connections
      for (let i = 0; i < inputCount; i++) {
        for (let j = 0; j < promptCount; j++) {
          const inputElement = inputRefs.current[i];
          const promptElement = promptRefs.current[j];
          
          if (inputElement && promptElement) {
            const inputRect = inputElement.getBoundingClientRect();
            const promptRect = promptElement.getBoundingClientRect();
            
            const startPos = { 
              x: inputRect.right - containerRect.left,
              y: inputRect.top + inputRect.height/2 - containerRect.top
            };
            const endPos = { 
              x: promptRect.left - containerRect.left,
              y: promptRect.top + promptRect.height/2 - containerRect.top
            };
            
            newConnections.push({
              id: `connection-${i}-${j}`,
              inputIndex: i,
              promptIndex: j,
              startPos,
              endPos
            });
          }
        }
      }
      
      // Add extension lines from left to inputs
      for (let i = 0; i < inputCount; i++) {
        const inputElement = inputRefs.current[i];
        if (inputElement) {
          const inputRect = inputElement.getBoundingClientRect();
          const inputY = inputRect.top + inputRect.height/2 - containerRect.top;
          
          newConnections.push({
            id: `left-extension-${i}`,
            inputIndex: i,
            promptIndex: -1,
            startPos: { x: 0, y: inputY },
            endPos: { x: inputRect.left - containerRect.left, y: inputY }
          });
        }
      }
      
      // Add extension lines from prompts to right
      for (let j = 0; j < promptCount; j++) {
        const promptElement = promptRefs.current[j];
        if (promptElement) {
          const promptRect = promptElement.getBoundingClientRect();
          const promptY = promptRect.top + promptRect.height/2 - containerRect.top;
          
          newConnections.push({
            id: `right-extension-${j}`,
            inputIndex: -1,
            promptIndex: j,
            startPos: { x: promptRect.right - containerRect.left, y: promptY },
            endPos: { x: 600, y: promptY }
          });
        }
      }
      
      console.log('Real DOM positions:', newConnections);
      setConnections(newConnections);
    }, 100);
  }, [inputCount, promptCount, isAnimating]);

  useEffect(() => {
    if (!isAnimating || connections.length === 0) return;

    const animateBeams = () => {
      // First animate left extensions
      const leftExtensions = connections.filter(c => c.id.startsWith('left-extension-'));
      leftExtensions.forEach((connection, index) => {
        setTimeout(() => {
          setActiveBeams(prev => new Set([...prev, connection.id]));
          
          setTimeout(() => {
            setActiveBeams(prev => {
              const newSet = new Set(prev);
              newSet.delete(connection.id);
              return newSet;
            });
          }, 400);
        }, index * 100);
      });
      
      // Then animate main connections
      const mainConnections = connections.filter(c => c.id.startsWith('connection-'));
      mainConnections.forEach((connection, index) => {
        setTimeout(() => {
          setActiveBeams(prev => new Set([...prev, connection.id]));
          
          setTimeout(() => {
            setActiveBeams(prev => {
              const newSet = new Set(prev);
              newSet.delete(connection.id);
              return newSet;
            });
          }, 600);
        }, 300 + index * 50);
      });
      
      // Finally animate right extensions
      const rightExtensions = connections.filter(c => c.id.startsWith('right-extension-'));
      rightExtensions.forEach((connection, index) => {
        setTimeout(() => {
          setActiveBeams(prev => new Set([...prev, connection.id]));
          
          setTimeout(() => {
            setActiveBeams(prev => {
              const newSet = new Set(prev);
              newSet.delete(connection.id);
              return newSet;
            });
          }, 400);
        }, 600 + index * 100);
      });
    };

    animateBeams();
    const interval = setInterval(animateBeams, 1500);

    return () => clearInterval(interval);
  }, [connections, isAnimating]);

  if (!isAnimating || inputCount === 0 || promptCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-[600px] h-60">
        {/* Inputs */}
        <div className="absolute left-20 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
          {Array.from({ length: inputCount }).map((_, index) => (
            <div
              key={`input-${index}`}
              ref={(el) => { inputRefs.current[index] = el; }}
              className="w-20 h-12 border border-gray-700 rounded-lg flex items-center justify-center text-gray-300 text-xs font-medium"
            >
              Input {index + 1}
            </div>
          ))}
        </div>

        {/* Prompts */}
        <div className="absolute right-20 top-1/2 transform -translate-y-1/2 flex flex-col gap-4">
          {Array.from({ length: promptCount }).map((_, index) => (
            <div
              key={`prompt-${index}`}
              ref={(el) => { promptRefs.current[index] = el; }}
              className="w-20 h-12 border border-gray-600 rounded-lg flex items-center justify-center text-gray-300 text-xs font-medium"
            >
              Prompt {index + 1}
            </div>
          ))}
        </div>

        {/* Beams */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
          {/* Static path lines */}
          {connections.map((connection) => (
            <line
              key={`path-${connection.id}`}
              x1={connection.startPos.x}
              y1={connection.startPos.y}
              x2={connection.endPos.x}
              y2={connection.endPos.y}
              stroke="#6b7280"
              strokeWidth="1"
              opacity="0.6"
              strokeDasharray="2,3"
            />
          ))}
          
          {/* Animated beams */}
          {connections.map((connection) => (
            <AnimatePresence key={connection.id}>
              {activeBeams.has(connection.id) && (() => {
                // Calculate the direction vector
                const dx = connection.endPos.x - connection.startPos.x;
                const dy = connection.endPos.y - connection.startPos.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const unitX = dx / length;
                const unitY = dy / length;
                const beamLength = 20;
                
                return (
                  <motion.line
                    key={connection.id}
                    stroke="#a1a1aa"
                    strokeWidth="1"
                    style={{
                      filter: 'drop-shadow(0 0 8px rgba(161, 161, 170, 1)) drop-shadow(0 0 3px rgba(161, 161, 170, 1))'
                    }}
                    initial={{ 
                      x1: connection.startPos.x,
                      y1: connection.startPos.y,
                      x2: connection.startPos.x + unitX * beamLength,
                      y2: connection.startPos.y + unitY * beamLength,
                      opacity: 1
                    }}
                    animate={{ 
                      x1: [
                        connection.startPos.x,
                        connection.endPos.x - unitX * beamLength,
                        connection.endPos.x
                      ],
                      y1: [
                        connection.startPos.y,
                        connection.endPos.y - unitY * beamLength,
                        connection.endPos.y
                      ],
                      x2: [
                        connection.startPos.x + unitX * beamLength,
                        connection.endPos.x,
                        connection.endPos.x
                      ],
                      y2: [
                        connection.startPos.y + unitY * beamLength,
                        connection.endPos.y,
                        connection.endPos.y
                      ]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.6,
                      ease: "easeInOut",
                      times: [0, 0.7, 1]
                    }}
                  />
                );
              })()}
            </AnimatePresence>
          ))}
        </svg>

      </div>
    </div>
  );
}
