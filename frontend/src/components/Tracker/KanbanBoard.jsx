// frontend/src/components/Tracker/KanbanBoard.jsx
import React, { useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    useDroppable,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TrackedJobCard } from './TrackedJobCard';
import { motion } from 'framer-motion';
import { Briefcase, Plus } from 'lucide-react';
import { DotPattern } from '../ui/dot-pattern';
import { cn } from '../../lib/utils';

// Sortable wrapper for job cards
const SortableJobCard = React.memo(({ job, onViewDetails, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: job._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 10,
        cursor: isDragging ? 'grabbing' : undefined, // Let the child component control the cursor when not dragging
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <TrackedJobCard
                job={job}
                onViewDetails={onViewDetails}
            />
        </div>
    );
});

// Column component
const KanbanColumn = React.memo(({ stage, jobs, onViewDetails }) => {
    const { setNodeRef, isOver } = useDroppable({ id: stage });
    const stageConfig = {
        saved: { label: 'Saved', color: 'blue', icon: Briefcase },
        applied: { label: 'Applied', color: 'purple', icon: Briefcase },
        screening: { label: 'Screening', color: 'yellow', icon: Briefcase },
        interview: { label: 'Interview', color: 'orange', icon: Briefcase },
        offer: { label: 'Offer', color: 'green', icon: Briefcase },
        rejected: { label: 'Rejected', color: 'red', icon: Briefcase },
        accepted: { label: 'Accepted', color: 'emerald', icon: Briefcase }
    };

    const config = stageConfig[stage] || stageConfig.saved;
    const Icon = config.icon;

    return (
        <SortableContext
            items={jobs.map(j => j._id)}
            strategy={verticalListSortingStrategy}
        >
            <div
                ref={setNodeRef}
                className={`flex flex-col min-w-[280px] max-w-[320px] rounded-2xl border p-4 h-[calc(100vh-220px)] transition-colors duration-200 ${isOver
                    ? 'bg-blue-500/10 border-blue-500/30'
                    : 'bg-bg-card/30 backdrop-blur-sm border-border-primary'
                    }`}
            >
                {/* Column Header */}
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-primary">
                    <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-${config.color}-500/10`}>
                            <Icon size={16} className={`text-${config.color}-400`} />
                        </div>
                        <h3 className="text-sm font-bold text-text-primary">{config.label}</h3>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-text-primary/5 text-text-secondary border border-border-secondary">
                        {jobs.length}
                    </span>
                </div>

                {/* Job Cards */}
                <div className="relative flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                    {/* Dot Pattern Background - static, no animation */}
                    <DotPattern
                        glow={false}
                        width={20}
                        height={20}
                        className={cn(
                            "absolute inset-0 opacity-15",
                            "[mask-image:radial-gradient(350px_circle_at_center,white,transparent)]"
                        )}
                    />
                    {jobs.length === 0 ? (
                        <div className="relative z-10 flex items-center justify-center h-full">
                            <p className="text-xs text-text-secondary/60 font-medium">Drag jobs here</p>
                        </div>
                    ) : (
                        jobs.map((job) => (
                            <SortableJobCard
                                key={job._id}
                                job={job}
                                onViewDetails={() => onViewDetails(job)}
                            />
                        ))
                    )}
                </div>
            </div>
        </SortableContext>
    );
});

/**
 * Kanban Board with drag-and-drop
 */
const KanbanBoardComponent = ({ jobs, onUpdateStage, onViewDetails, onDelete }) => {
    const [activeId, setActiveId] = React.useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Group jobs by stage
    const jobsByStage = useMemo(() => {
        const stages = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'];
        return stages.reduce((acc, stage) => {
            acc[stage] = jobs.filter(job => job.stage === stage);
            return acc;
        }, {});
    }, [jobs]);

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveId(null);
            return;
        }

        // Find the job being dragged
        const activeJob = jobs.find(j => j._id === active.id);

        if (!activeJob) {
            setActiveId(null);
            return;
        }

        let newStage = null;

        // Check if dropped over a column directly (stage name like 'saved', 'applied', etc.)
        const stages = ['saved', 'applied', 'screening', 'interview', 'offer', 'rejected', 'accepted'];
        if (stages.includes(over.id)) {
            newStage = over.id;
        } else {
            // Dropped over another job - find its stage
            const overJob = jobs.find(j => j._id === over.id);
            if (overJob) {
                newStage = overJob.stage;
            }
        }

        // Update if stage changed
        if (newStage && newStage !== activeJob.stage) {
            onUpdateStage(activeJob._id, newStage);
        }

        setActiveId(null);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;

        if (!over) return;

        const activeJob = jobs.find(j => j._id === active.id);
        const overJob = jobs.find(j => j._id === over.id);

        if (overJob && activeJob && overJob.stage !== activeJob.stage) {
            // Optimistically update the UI
            // This will be confirmed when handleDragEnd is called
        }
    };

    const activeJob = activeId ? jobs.find(j => j._id === activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={handleDragOver}
        >
            <div className="flex gap-4 overflow-x-auto pb-6 custom-scrollbar">
                {Object.entries(jobsByStage).map(([stage, stageJobs]) => (
                    <KanbanColumn
                        key={stage}
                        stage={stage}
                        jobs={stageJobs}
                        onViewDetails={onViewDetails}
                        onDelete={onDelete}
                    />
                ))}
            </div>

            <DragOverlay>
                {activeJob ? (
                    <motion.div
                        initial={{ rotate: 0, scale: 1 }}
                        animate={{ rotate: 3, scale: 1.05 }}
                        className="opacity-90 shadow-2xl cursor-grabbing"
                    >
                        <TrackedJobCard
                            job={activeJob}
                            onViewDetails={() => { }}
                            isDragging={true}
                        />
                    </motion.div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export const KanbanBoard = React.memo(KanbanBoardComponent);
