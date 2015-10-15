package org.carat20.client.device;

import android.util.Log;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.HashMap;


/**
 * Provides device information and statistics.
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
     * @return HashMap containing memory statistics.
     */
    public static HashMap<String, Integer> getMemoryInfo() {
        HashMap<String, Integer> result = new HashMap<String, Integer>();
        RandomAccessFile reader;
        try {
            reader = new RandomAccessFile("/proc/meminfo", "r");
            int[] data = readLines(reader, 7);
            result.put("total", data[0]);
            result.put("free", data[1]);
            result.put("cached", data[3]);
            result.put("active", data[5]);
            result.put("inactive", data[6]);
            return result;
        } catch (IOException e) {
            Log.v("Carat", "Failed to read meminfo", e);
        }
        return null;
    }

    // Helper method for iterating /proc/meminfo
    private static int[] readLines(RandomAccessFile reader, int limit) throws IOException {
        String line;
        int[] result = new int[limit+1];
        for (int index = 0; index <= limit; index++) {
            line = reader.readLine();
            if(line == null) break;
            result[index] = Integer.parseInt(line.split("\\s+")[1]);
        }
        reader.seek(0);
        return result;
    }
}
