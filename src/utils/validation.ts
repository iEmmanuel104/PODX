import { BadRequestError } from './customErrors';

interface DurationRequirement {
    value: number;
    type: 'absolute' | 'percentage';
}

export function validateDurationRequirement(durationReq?: DurationRequirement): void {
    if (!durationReq) return; // Use default values if not provided

    if (!durationReq.value || typeof durationReq.value !== 'number') {
        throw new BadRequestError('Duration requirement value must be a number');
    }

    if (durationReq.value <= 0) {
        throw new BadRequestError('Duration requirement value must be positive');
    }

    if (!durationReq.type || !['absolute', 'percentage'].includes(durationReq.type)) {
        throw new BadRequestError('Duration requirement type must be either "absolute" or "percentage"');
    }

    // For percentage type, value must be between 0 and 100
    if (durationReq.type === 'percentage' && (durationReq.value < 0 || durationReq.value > 100)) {
        throw new BadRequestError('Percentage duration requirement must be between 0 and 100');
    }

    // For absolute type, value must be at least 1 second
    if (durationReq.type === 'absolute' && durationReq.value < 1) {
        throw new BadRequestError('Absolute duration requirement must be at least 1 second');
    }
} 