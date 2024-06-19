import si from 'systeminformation';
import { App } from '../structure/app/app';

let exists = false;
export const stats = (app: App) => {
    if (exists) {
        throw new Error('Stats already exists');
    }
    exists = true;
    setInterval(async () => {
        const [
            cpu,
            memory,
            _disk,
            _network,
            _battery,
            temperature,
            _processes,
            _fsSize,
            _fsStats
        ] = await Promise.all([
            si.cpu(),
            si.mem(),
            si.disksIO(),
            si.networkStats(),
            si.battery(),
            si.cpuTemperature(),
            si.processes(),
            si.fsSize(),
            si.fsStats()
        ]);
        app.io.to('admin').emit('stats', {
            cpu: {
                temperature: temperature.main,
                speed: cpu.speed,
                voltage: cpu.voltage,
                min: cpu.speedMin,
                max: cpu.speedMax
            },
            memory: {
                total: memory.total,
                free: memory.free,
                used: memory.used,
                active: memory.active,
                available: memory.available
            }
        });
    }, 1000 * 60);
};
