package org.carat20.client.device;

/**
 * Simple wrapper for the first line of /proc/stat.
 * @author Jonatan Hamberg
 */
public class CPUStats {
    public float user, system, nice, idle, iowait, irq, softirq, steal, guest, 
            guestnice, systemAll, idleAll, total, virtualAll, userAll, niceAll;
    
    public CPUStats(int[] data){
        // source
        this.user =         data[1];
        this.system =       data[2];
        this.nice =         data[3];
        this.idle =         data[4];
        this.iowait =       data[5];
        this.irq =          data[6];
        this.softirq =      data[7];
        this.steal =        data[8];
        this.guest =        data[9];
        this.guestnice =    data[10];
        
        // calculated values
        this.userAll = user - guest;
        this.niceAll = nice - guestnice;
        this.idleAll = idle + iowait;
        this.systemAll = system + irq + softirq;
        this.virtualAll = guest + guestnice;
        this.total = userAll + niceAll + systemAll + idleAll + steal + virtualAll;
    }    
}
