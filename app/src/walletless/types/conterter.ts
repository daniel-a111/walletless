import { DifficultyUnit } from ".";
import * as consts from "../consts";

export function timeUnitToMS(unit: DifficultyUnit): number {
    switch(unit) {
        case 'MS':
            return consts.MS;
        case 'SEC':
            return consts.SEC;
        case 'MIN':
            return consts.MIN;
        case 'HOUR':
            return consts.HOUR;
        case 'DAY':
            return consts.DAY;
    }
}