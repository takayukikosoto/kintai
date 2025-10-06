"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.onTimesheetWrite = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const dayjs_1 = __importDefault(require("dayjs"));
const utc_1 = __importDefault(require("dayjs/plugin/utc"));
const timezone_1 = __importDefault(require("dayjs/plugin/timezone"));
dayjs_1.default.extend(utc_1.default);
dayjs_1.default.extend(timezone_1.default);
const JST = 'Asia/Tokyo';
admin.initializeApp();
const db = admin.firestore();
exports.onTimesheetWrite = functions.firestore
    .document('timesheets/{id}')
    .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    if (!after)
        return;
    // Recompute pay defensively on backend if fields exist
    let pay = 0;
    if (after.type === 'hourly' && after.clockIn && after.clockOut) {
        const start = dayjs_1.default.utc(after.clockIn);
        const end = dayjs_1.default.utc(after.clockOut);
        const worked = Math.max(0, end.diff(start, 'minute') - (after.breaksMinutes || 0));
        const rate = after.hourlyRate || 0;
        pay = Math.round((worked / 60) * rate);
        await change.after.ref.update({ workedMinutes: worked, payJPY: pay, updatedAt: new Date().toISOString() });
    }
    else if (after.type === 'field') {
        const dayRate = after.field?.dayRateJPY || 0;
        const trans = after.field?.transportJPY || 0;
        const allow = after.field?.allowanceJPY || 0;
        pay = dayRate + trans + allow;
        await change.after.ref.update({ payJPY: pay, updatedAt: new Date().toISOString() });
    }
});
