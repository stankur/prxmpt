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
  const timeoutIds = useRef<Set<NodeJS.Timeout>>(new Set());

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
      
      // Add basic extension lines from prompts to right (for static paths)
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
            endPos: { x: containerRect.width, y: promptY }
          });
          
          // Create one output beam for each input that goes to this prompt
          for (let i = 0; i < inputCount; i++) {
            newConnections.push({
              id: `right-extension-${j}-from-input-${i}`,
              inputIndex: i,
              promptIndex: j,
              startPos: { x: promptRect.right - containerRect.left, y: promptY },
              endPos: { x: containerRect.width, y: promptY }
            });
          }
        }
      }
      
      console.log('Real DOM positions:', newConnections);
      setConnections(newConnections);
    }, 100);
  }, [inputCount, promptCount, isAnimating]);

  // Clear active beams when animation is paused
  useEffect(() => {
    if (!isAnimating) {
      setActiveBeams(new Set());
      // Clear all pending timeouts
      timeoutIds.current.forEach(id => clearTimeout(id));
      timeoutIds.current.clear();
    }
  }, [isAnimating]);

  useEffect(() => {
    if (!isAnimating || connections.length === 0) return;

    const addTimeout = (callback: () => void, delay: number) => {
      const id = setTimeout(() => {
        timeoutIds.current.delete(id);
        callback();
      }, delay);
      timeoutIds.current.add(id);
      return id;
    };

    const animateBeams = () => {
      const leftExtensions = connections.filter(c => c.id.startsWith('left-extension-'));
      const mainConnections = connections.filter(c => c.id.startsWith('connection-'));
      const rightExtensions = connections.filter(c => c.id.startsWith('right-extension-'));
      
      // Animate each input path with its multiplication
      leftExtensions.forEach((leftExt, inputIndex) => {
        addTimeout(() => {
          // 1. Beam comes from left to input
          setActiveBeams(prev => new Set([...prev, leftExt.id]));
          
          addTimeout(() => {
            setActiveBeams(prev => {
              const newSet = new Set(prev);
              newSet.delete(leftExt.id);
              return newSet;
            });
            
            // 2. Processing delay inside input box (beam hidden)
            addTimeout(() => {
              // 3. Beam exits input and goes to prompts (multiplication)
              const inputConnections = mainConnections.filter(c => 
                c.inputIndex === inputIndex
              );
              inputConnections.forEach(conn => {
                setActiveBeams(prev => new Set([...prev, conn.id]));
              });
              
              addTimeout(() => {
                // 4. Remove main connections (beams enter prompt boxes)
                inputConnections.forEach(conn => {
                  setActiveBeams(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(conn.id);
                    return newSet;
                  });
                });
                
                // 5. Processing delay inside prompt boxes (beams hidden)
                addTimeout(() => {
                  // 6. Beams exit prompt boxes to the right
                  inputConnections.forEach(conn => {
                    const rightExt = rightExtensions.find(r => 
                      r.promptIndex === conn.promptIndex && r.inputIndex === inputIndex
                    );
                    if (rightExt) {
                      setActiveBeams(prev => new Set([...prev, rightExt.id]));
                      
                      addTimeout(() => {
                        setActiveBeams(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(rightExt.id);
                          return newSet;
                        });
                      }, 600);
                    }
                  });
                }, 500); // Processing delay in prompt boxes
                
              }, 600);
              
            }, 600); // Processing delay in input box
            
          }, 600);
        }, inputIndex * 200); // Stagger each input path
      });
    };

    // Run animation once on mount
    animateBeams();
  }, [connections, isAnimating]);

  if (inputCount === 0 || promptCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-center py-8">
      <div className="relative w-full max-w-xl lg:w-1/2 lg:max-w-none h-48">
        {/* Inputs */}
        <div className="absolute left-[25%] top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3">
          {Array.from({ length: inputCount }).map((_, index) => (
            <div
              key={`input-${index}`}
              ref={(el) => { inputRefs.current[index] = el; }}
              className="w-16 h-10 border border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-xs font-medium"
            >
              Input {index + 1}
            </div>
          ))}
        </div>

        {/* Prompts */}
        <div className="absolute left-[75%] top-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col gap-3">
          {Array.from({ length: promptCount }).map((_, index) => (
            <div
              key={`prompt-${index}`}
              ref={(el) => { promptRefs.current[index] = el; }}
              className="w-16 h-10 border border-gray-600 rounded-lg flex items-center justify-center text-gray-500 text-xs font-medium"
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
                
                // Assign colors based on input index (less saturated colors)
                const colors = ['#dc8c8c', '#8cb58c', '#8c9cdc', '#dcc28c']; // muted red, green, blue, yellow
                const beamColor = colors[connection.inputIndex] || '#a1a1aa';
                
                return (
                  <motion.line
                    key={connection.id}
                    stroke={beamColor}
                    strokeWidth="2"
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
                      duration: 1.2,
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
