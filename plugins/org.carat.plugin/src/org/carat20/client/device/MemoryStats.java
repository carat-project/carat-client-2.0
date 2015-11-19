
package org.carat20.client.device;

/**
 * Simple wrapper for data found in /proc/meminfo.
 * @author Jonatan Hamberg
 */
public class MemoryStats {
    public float total, free, cached, active, inactive, used, available;
    
    public MemoryStats(int[][] data){
        // source
        this.total = data[0][1];
        this.free = data[1][1];
        this.cached = data[3][1];
        this.active = data[5][1];
        this.inactive = data[6][1];
        
        // calculated values
        this.available = free + cached;
        this.used = total - available;
    }
}
