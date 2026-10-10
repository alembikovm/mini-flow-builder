import type { DeviceId } from '../../app/store';

export type DeviceSpec = {
  id: DeviceId;
  label: string;
  width: number;
  height: number;
  safeTop: number;
  safeBottom: number;
  cornerRadius: number;
};

export const DEVICES: Record<DeviceId, DeviceSpec> = {
  iphone: { id: 'iphone', label: 'iPhone', width: 393, height: 852, safeTop: 59, safeBottom: 34, cornerRadius: 48 },
  iphoneSE: {
    id: 'iphoneSE',
    label: 'iPhone SE',
    width: 375,
    height: 667,
    safeTop: 20,
    safeBottom: 0,
    cornerRadius: 20,
  },
  android: {
    id: 'android',
    label: 'Android',
    width: 412,
    height: 915,
    safeTop: 24,
    safeBottom: 48,
    cornerRadius: 36,
  },
};
