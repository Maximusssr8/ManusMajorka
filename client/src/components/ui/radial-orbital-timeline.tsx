'use client';
import { ArrowRight, Link, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  content: string;
  category: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  relatedIds: number[];
  status: 'completed' | 'in-progress' | 'pending';
  energy: number;
}

interface RadialOrbitalTimelineProps {
  timelineData: TimelineItem[];
}

export default function RadialOrbitalTimeline({ timelineData }: RadialOrbitalTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [pulseEffect, setPulseEffect] = useState<Record<number, boolean>>({});
  const [centerOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeNodeId, setActiveNodeId] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedItems({});
      setActiveNodeId(null);
      setPulseEffect({});
      setAutoRotate(true);
    }
  };

  const toggleItem = (id: number) => {
    setExpandedItems((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        if (parseInt(key) !== id) newState[parseInt(key)] = false;
      });
      newState[id] = !prev[id];
      if (!prev[id]) {
        setActiveNodeId(id);
        setAutoRotate(false);
        const relatedItems = getRelatedItems(id);
        const newPulseEffect: Record<number, boolean> = {};
        relatedItems.forEach((relId) => {
          newPulseEffect[relId] = true;
        });
        setPulseEffect(newPulseEffect);
        centerViewOnNode(id);
      } else {
        setActiveNodeId(null);
        setAutoRotate(true);
        setPulseEffect({});
      }
      return newState;
    });
  };

  useEffect(() => {
    let rotationTimer: ReturnType<typeof setInterval>;
    if (autoRotate) {
      rotationTimer = setInterval(() => {
        setRotationAngle((prev) => Number(((prev + 0.3) % 360).toFixed(3)));
      }, 50);
    }
    return () => {
      if (rotationTimer) clearInterval(rotationTimer);
    };
  }, [autoRotate]);

  const centerViewOnNode = (nodeId: number) => {
    const nodeIndex = timelineData.findIndex((item) => item.id === nodeId);
    const totalNodes = timelineData.length;
    const targetAngle = (nodeIndex / totalNodes) * 360;
    setRotationAngle(270 - targetAngle);
  };

  const calculateNodePosition = (index: number, total: number) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 200;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian) + centerOffset.x;
    const y = radius * Math.sin(radian) + centerOffset.y;
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.4, Math.min(1, 0.4 + 0.6 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, angle, zIndex, opacity };
  };

  const getRelatedItems = (itemId: number): number[] => {
    const currentItem = timelineData.find((item) => item.id === itemId);
    return currentItem ? currentItem.relatedIds : [];
  };

  const isRelatedToActive = (itemId: number): boolean => {
    if (!activeNodeId) return false;
    return getRelatedItems(activeNodeId).includes(itemId);
  };

  const getStatusStyles = (status: TimelineItem['status']): string => {
    switch (status) {
      case 'completed':
        return 'text-white bg-black border-white';
      case 'in-progress':
        return 'text-black bg-white border-black';
      case 'pending':
        return 'text-white bg-black/40 border-white/50';
      default:
        return 'text-white bg-black/40 border-white/50';
    }
  };

  return (
    <div
      className="w-full h-[600px] flex flex-col items-center justify-center overflow-hidden"
      ref={containerRef}
      onClick={handleContainerClick}
    >
      <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
        <div
          className="absolute w-full h-full flex items-center justify-center"
          ref={orbitRef}
          style={{
            perspective: '1000px',
            transform: `translate(${centerOffset.x}px, ${centerOffset.y}px)`,
          }}
        >
          {/* Centre orb */}
          <div
            className="absolute w-16 h-16 rounded-full flex items-center justify-center z-10"
            style={{
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              boxShadow: '0 0 40px rgba(99,102,241,0.5)',
            }}
          >
            <div className="absolute w-20 h-20 rounded-full border border-yellow-400/20 animate-ping opacity-70" />
            <div
              className="absolute w-24 h-24 rounded-full border border-yellow-400/10 animate-ping opacity-50"
              style={{ animationDelay: '0.5s' }}
            />
            <div className="w-8 h-8 rounded-full" style={{ background: '#FAFAFA' }} />
          </div>

          {/* Orbit ring */}
          <div className="absolute w-96 h-96 rounded-full border border-white/10" />

          {timelineData.map((item, index) => {
            const position = calculateNodePosition(index, timelineData.length);
            const isExpanded = expandedItems[item.id];
            const isRelated = isRelatedToActive(item.id);
            const isPulsing = pulseEffect[item.id];
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                ref={(el) => {
                  nodeRefs.current[item.id] = el;
                }}
                className="absolute transition-all duration-700 cursor-pointer"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px)`,
                  zIndex: isExpanded ? 200 : position.zIndex,
                  opacity: isExpanded ? 1 : position.opacity,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleItem(item.id);
                }}
              >
                {/* Energy glow */}
                <div
                  className={`absolute rounded-full -inset-1 ${isPulsing ? 'animate-pulse' : ''}`}
                  style={{
                    background:
                      'radial-gradient(circle, rgba(99,102,241,0.25) 0%, rgba(99,102,241,0) 70%)',
                    width: `${item.energy * 0.5 + 40}px`,
                    height: `${item.energy * 0.5 + 40}px`,
                    left: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                    top: `-${(item.energy * 0.5 + 40 - 40) / 2}px`,
                  }}
                />

                {/* Node button */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isExpanded ? 'scale-150' : ''} ${isPulsing ? 'animate-pulse' : ''}`}
                  style={{
                    background: isExpanded
                      ? '#6366F1'
                      : isRelated
                        ? 'rgba(99,102,241,0.4)'
                        : 'rgba(8,10,14,0.9)',
                    borderColor: isExpanded
                      ? '#6366F1'
                      : isRelated
                        ? '#6366F1'
                        : 'rgba(99,102,241,0.4)',
                    color: isExpanded ? '#FAFAFA' : '#6366F1',
                    boxShadow: isExpanded ? '0 0 20px rgba(99,102,241,0.5)' : 'none',
                  }}
                >
                  <Icon size={16} />
                </div>

                {/* Label */}
                <div
                  className={`absolute top-12 whitespace-nowrap text-xs font-bold tracking-wider transition-all duration-300 ${isExpanded ? 'scale-125' : ''}`}
                  style={{
                    color: isExpanded ? '#6366F1' : '#374151',
                    fontFamily: "'Bricolage Grotesque', sans-serif",
                    left: '50%',
                    transform: `translateX(-50%) ${isExpanded ? 'scale(1.25)' : ''}`,
                  }}
                >
                  {item.title}
                </div>

                {/* Expanded card */}
                {isExpanded && (
                  <Card
                    className="absolute top-20 left-1/2 -translate-x-1/2 w-64 overflow-visible"
                    style={{
                      background: 'rgba(8,10,14,0.95)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(99,102,241,0.3)',
                      boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(99,102,241,0.1)',
                    }}
                  >
                    <div
                      className="absolute -top-3 left-1/2 -translate-x-1/2 w-px h-3"
                      style={{ background: 'rgba(99,102,241,0.5)' }}
                    />
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <Badge className={`px-2 text-xs ${getStatusStyles(item.status)}`}>
                          {item.status === 'completed'
                            ? 'COMPLETE'
                            : item.status === 'in-progress'
                              ? 'IN PROGRESS'
                              : 'PENDING'}
                        </Badge>
                        <span
                          className="text-xs font-mono"
                          style={{ color: '#9CA3AF' }}
                        >
                          {item.date}
                        </span>
                      </div>
                      <CardTitle
                        className="text-sm mt-2"
                        style={{ color: '#0A0A0A', fontFamily: "'Bricolage Grotesque', sans-serif" }}
                      >
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p
                        className="text-xs leading-relaxed mb-3"
                        style={{ color: '#374151' }}
                      >
                        {item.content}
                      </p>
                      <div className="flex items-center justify-between">
                        <span
                          className="text-xs px-2 py-1 rounded-full"
                          style={{
                            background: 'rgba(99,102,241,0.1)',
                            color: '#6366F1',
                            border: '1px solid rgba(99,102,241,0.2)',
                          }}
                        >
                          {item.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <Zap size={10} style={{ color: '#6366F1' }} />
                          <span className="text-xs" style={{ color: '#9CA3AF' }}>
                            {item.energy}%
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { RadialOrbitalTimeline };
