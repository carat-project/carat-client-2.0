package org.carat20.client.device;

import android.util.Log;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.HashMap;

/**
 * Provides device information and statistics.
 *
 * @author Jonatan Hamberg
 */
public class DeviceLibrary {

    /**
     * @return Device manufacturer.
     */
    public static String getManufacturer() {
        return android.os.Build.MANUFACTURER;
    }

    /**
     * @return Device model.
     */
    public static String getModel() {
        return android.os.Build.MODEL;
    }

    /**
     * @return Operating system version.
     */
    public static String getOsVersion() {
        return android.os.Build.VERSION.RELEASE;
    }

    /**
     * @return Product name.
     */
    public static String getProductName() {
        return android.os.Build.PRODUCT;
    }

    /**
     * @return Product brand.
     */
    public static String getBrand() {
        return android.os.Build.BRAND;
    }

    /**
     * Fetch memory information from /proc/meminfo.
     *
     * @return HashMap containing memory statistics.
     */
    public static HashMap<String, Integer> getMemoryInfo() {
        Log.v("Carat","Reading memory info");
        HashMap<String, Integer> result = new HashMap<String, Integer>();
        RandomAccessFile reader;
        try {
            reader = new RandomAccessFile("/proc/meminfo", "r");
            int[][] data = readLines(reader, 7, 2, "\\s+");
            int[] total = data[0];
            result.put("total", data[0][1]);
            result.put("free", data[1][1]);
            result.put("cached", data[3][1]);
            result.put("active", data[5][1]);
            result.put("inactive", data[6][1]);
            reader.close();
            return result;
        } catch (IOException e) {
            Log.v("Carat", "Failed to read meminfo", e);
        }
        return null;
    }

    /**
     * Snapshot cpu stats and calculate usage percentage.
     * @param interval Snapshot interval.
     * @return CPU usage percentage.
     */
    public static float getCpuUsage(int interval) {
        Log.v("Carat","Reading cpu usage");
        try {
            RandomAccessFile reader = new RandomAccessFile("/proc/stat", "r");
            int[] data = readLines(reader, 1, 10, "\\s+")[0];
            CPUStats cpu1 = new CPUStats(data); //Snapshot 1
            try {
                Thread.sleep(interval);
            } catch (Exception e) {
                // ...
            }
            data = readLines(reader, 1, 10, "\\s+")[0];
            CPUStats cpu2 = new CPUStats(data); //Snapshot 2
            
            float totaldiff = cpu2.total - cpu1.total;
            if(totaldiff == 0) return 100; // Avoid diving by zero
            float idlediff = cpu2.idleAll - cpu1.idleAll; 
            float cpuP = 100*(totaldiff - idlediff)/totaldiff;
            
            // Disregard negative values
            return (cpuP > 0)? cpuP : 0;
        } catch (IOException e) {
            Log.v("Carat", "Failed reading /proc/stat");
            return 0;
        }
    }
    
    // Helper method for reading /stat/proc or meminfo
    private static int[][] readLines(RandomAccessFile reader, int maxRows, int maxColumns, String delim) throws IOException {
        int[][] result = new int[maxRows+1][maxColumns+1];
        for (int row = 0; row < maxRows; row++) {
            String line = reader.readLine();
            if (line == null) break; // EOF
            String[] tokens = line.split(delim);
            for (int column = 0; column < maxColumns; column++) {
                if(maxColumns < tokens.length && isInteger(tokens[column])){
                    result[row][column] = Integer.parseInt(tokens[column]);
                } else result[row][column] = 0; // Default to zero
            }
        }
        reader.seek(0); // Rewind
        return result;
    }

    // Utility method
    public static boolean isInteger(String self) {
        try {
            Integer.valueOf(self.trim());
            return true;
        } catch (NumberFormatException n) {
            return false;
        }
    }
}
