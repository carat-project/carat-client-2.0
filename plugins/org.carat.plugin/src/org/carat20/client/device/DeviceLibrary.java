package org.carat20.client.device;

import android.app.Activity;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.location.Criteria;
import android.location.Location;
import android.location.LocationManager;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.net.wifi.WifiInfo;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.provider.Settings;
import android.provider.Settings.SettingNotFoundException;
import android.support.v4.app.NotificationCompat;
import android.telephony.TelephonyManager;
import android.util.Log;
import android.view.Window;
import android.view.WindowManager;
import java.io.IOException;
import java.io.RandomAccessFile;
import java.util.HashMap;
import org.carat20.client.utility.TypeUtilities;

/**
 * Provides device information and statistics.
 *
 * @author Jonatan Hamberg
 */
public class DeviceLibrary {
    private static Context context;
    private static Intent intent;
    private static TelephonyManager telManager;
    private static Location lastKnownLocation;
    private static Activity activity;
    
    // Setting intent literals
    public static final String BATTERY_TEMPERATURE = "batteryTemperature";
    public static final String BATTERY_HEALTH = "batteryHealth";
    public static final String WIFI_SIGNAL_STRENGTH = "wifiSignalStrength";
    public static final String WIFI_STATUS = "wifiStatus";
    public static final String NETWORK_TYPE = "networkType";
    public static final String MOBILE_NETWORK_TYPE = "mobileNetworkType";
    public static final String MOBILE_DATA_ACTIVITY = "mobileDataActivity";
    public static final String MOBILE_DATA_STATUS = "mobileDataStatus";
    public static final String CPU_USAGE = "cpuUsage";
    public static final String SCREEN_BRIGHTNESS = "screenBrightness";
    public static final String DISTANCE_TRAVELED = "distanceTraveled";
    
    // Grotesque hack, don't deploy
    private static final HashMap<String, String> settingMap = new HashMap<String, String>(){{
        put(WIFI_STATUS, Settings.ACTION_WIFI_SETTINGS);
        put(NETWORK_TYPE, Settings.ACTION_SETTINGS);
        put(MOBILE_NETWORK_TYPE, Settings.ACTION_DATA_ROAMING_SETTINGS);
        put(SCREEN_BRIGHTNESS, Settings.ACTION_DISPLAY_SETTINGS);
    }};

    public DeviceLibrary(Context context, Intent intent, Activity activity){
                 context.getSystemService(Context.TELEPHONY_SERVICE);
        lastKnownLocation = null;
        DeviceLibrary.context = context;
        DeviceLibrary.intent = intent;
        DeviceLibrary.activity = activity;
        telManager = (TelephonyManager) context.getSystemService(Context.TELEPHONY_SERVICE);
    }
    
    /**
     * 
     * @param settingName Setting name, see literals.
     * @return Android settings literal
     */
    public static String getSetting(String settingName){
        String setting = settingMap.get(settingName);
        if(setting == null) return "unknown";
        return setting;
    }

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

    public HashMap<String, Object> getDeviceInfo(){
        return new HashMap<String, Object>() {{
            put(BATTERY_TEMPERATURE, getBatteryTemperature());
            put(BATTERY_HEALTH, getBatteryHealth());
            put(WIFI_SIGNAL_STRENGTH, getWifiSignalStrength());
            put(WIFI_STATUS, getWifiStatus());
            put(NETWORK_TYPE, getNetworkType());
            put(MOBILE_NETWORK_TYPE, getMobileNetworkType());
            put(MOBILE_DATA_ACTIVITY, getMobileDataActivity());
            put(MOBILE_DATA_STATUS, getMobileDataStatus());
            put(CPU_USAGE, (int) getCpuUsage(1000));
            put(SCREEN_BRIGHTNESS, getScreenBrightness());
            put(DISTANCE_TRAVELED, (int) getDistanceTraveled());
        }};
    }

    /**
     * @return Battery temperature
     */
    public int getBatteryTemperature() {
        return intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0) / 10;
    }

    /**
     * @return Battery health
     */
    public String getBatteryHealth(){
        int health = intent.getIntExtra(BatteryManager.EXTRA_HEALTH, 0);
        switch(health) {
            case BatteryManager.BATTERY_HEALTH_DEAD: return "dead";
            case BatteryManager.BATTERY_HEALTH_GOOD: return "good";
            case BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE: return "over voltage";
            case BatteryManager.BATTERY_HEALTH_OVERHEAT: return "overheat";
            case BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE: return "unspecified failure";
            default: return "unknown";
        }
    }

    /**
     * @return WiFi signal strength
     */
    public int getWifiSignalStrength() {
        WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
        WifiInfo myWifiInfo = wifiManager.getConnectionInfo();
        return myWifiInfo.getRssi();
    }

    /**
     * @return WiFi status
     */
    public String getWifiStatus(){
        WifiManager wifiManager = (WifiManager) context.getSystemService(Context.WIFI_SERVICE);
	int wifiState = wifiManager.getWifiState();
        switch (wifiState) {
            case WifiManager.WIFI_STATE_DISABLED: return "disabled";
            case WifiManager.WIFI_STATE_DISABLING: return "disabling";
            case WifiManager.WIFI_STATE_ENABLED: return "enabled";
            case WifiManager.WIFI_STATE_ENABLING: return "enabling";
            default: return "unknown";
        }
    }

    /**
     * Get general network type, like mobile or wifi.
     * @return Network type
     */
    public String getNetworkType() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return "unknown";
        NetworkInfo i = cm.getActiveNetworkInfo();
        if (i == null) return "unknown";
        return i.getTypeName().toLowerCase();
    }

    /**
     * Get specific mobile network type
     * @return Mobile network type
     */
    public String getMobileNetworkType() {
        int netType = telManager.getNetworkType();
        switch (netType) {
            case TelephonyManager.NETWORK_TYPE_1xRTT: return "1xrtt";
            case TelephonyManager.NETWORK_TYPE_CDMA: return "cdma";
            case TelephonyManager.NETWORK_TYPE_EDGE: return "edge";
            case 14: return "ehrpd";
            case TelephonyManager.NETWORK_TYPE_EVDO_0: return "evdo_0";
            case TelephonyManager.NETWORK_TYPE_EVDO_A: return "evdo_a";
            case 12: return "evdo_b";
            case TelephonyManager.NETWORK_TYPE_GPRS: return "gprs";
            case TelephonyManager.NETWORK_TYPE_HSDPA: return "hsdpa";
            case TelephonyManager.NETWORK_TYPE_HSPA: return "hspa";
            case 15: return "hspap";
            case TelephonyManager.NETWORK_TYPE_HSUPA: return "hsupa";
            case TelephonyManager.NETWORK_TYPE_IDEN: return "iden";
            case 13: return "lte";
            case TelephonyManager.NETWORK_TYPE_UMTS: return "umts";
            default: return Integer.toString(netType);
        }
    }

    /**
     * @return Mobile data activity
     */
    public String getMobileDataActivity(){
        int dataActivity = telManager.getDataActivity();
        switch (dataActivity) {
            case TelephonyManager.DATA_ACTIVITY_IN: return "in";
            case TelephonyManager.DATA_ACTIVITY_OUT: return "out";
            case TelephonyManager.DATA_ACTIVITY_INOUT: return "inout";
            default: return "none";
        }
    }

    /**
     * @return Data state
     */
    public String getMobileDataStatus() {
	int dataState = telManager.getDataState();
	switch (dataState) {
            case TelephonyManager.DATA_CONNECTED: return "connected";
            case TelephonyManager.DATA_CONNECTING: return "connecting";
            case TelephonyManager.DATA_DISCONNECTED: return "disconnected";
            default: return "suspended";
	}
    }

    /**
     * @return Screen brightness
     */
    public int getScreenBrightness() {
        // Todo: Fix values for auto-brightness mode
        String setting = android.provider.Settings.System.SCREEN_BRIGHTNESS;
        int screenBrightnessValue = 0;
        try {
            screenBrightnessValue = android.provider.Settings.System.getInt(context.getContentResolver(), setting);
        } catch (SettingNotFoundException e) {
            Log.v("Carat", "Failed to read brightness value", e);
        }
        return screenBrightnessValue;
    }

    /**
     * @return Distance between current location and last snapshot
     */
    public double getDistanceTraveled(){
        Location location;
        LocationManager lm = (LocationManager) context.getSystemService(Context.LOCATION_SERVICE);

        Criteria low = new Criteria();
        low.setAccuracy(Criteria.ACCURACY_COARSE);
        low.setPowerRequirement(Criteria.POWER_LOW);

        double distance = 0.0;
        String provider = lm.getBestProvider(low, true);
        if(provider != null && !provider.equals("gps")){
            location =  lm.getLastKnownLocation(provider);
            if(location != null && lastKnownLocation != null){
                distance = lastKnownLocation.distanceTo(location);
            }
            lastKnownLocation = location;
        }
        return distance;
    }

    /**
     * Show a local notification.
     * @param title Title
     * @param content Content
     */
    public static void showNotification(String title, String content) {
        Log.v("Carat", "Showing notification");

        // Get application launch intent
        String mainPackage = context.getPackageName();
        Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(mainPackage);
        launchIntent.addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pIntent = PendingIntent.getActivity(context, 0, launchIntent, 0);

        // Build the notification
        NotificationCompat.Builder notification = new NotificationCompat.Builder(context)
                .setSmallIcon(context.getApplicationInfo().icon) // This needs to be transparent
                .setLargeIcon(ApplicationLibrary.getApplicationIcon(mainPackage, context))
                .setContentTitle(title)
                .setContentText(content);
        notification.setContentIntent(pIntent);
        notification.setAutoCancel(true);

        // Show the notification
        NotificationManager nManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        nManager.notify(1, notification.build());
    }

    /**
     * Fetch memory information from /proc/meminfo.
     *
     * @return HashMap containing memory statistics.
     */
    public static MemoryStats getMemoryStats() {
        //Log.v("Carat", "Reading memory info");
        RandomAccessFile reader;
        try {
            reader = new RandomAccessFile("/proc/meminfo", "r");
            int[][] data = readLines(reader, 7, 2, "\\s+");
            reader.close();
            return new MemoryStats(data);
        } catch (IOException e) {
            Log.v("Carat", "Failed to read meminfo", e);
        }
        return null;
    }

    /**
     * Get memory usage percentage
     * @return Memory usage percentage
     */
    public static float getMemoryUsage(){
        MemoryStats mem = getMemoryStats();
        float memP = 100*(mem.used/mem.total);
        return (memP > 0)? memP : 0;
    }

    /**
     * Snapshot cpu stats and calculate usage percentage.
     * @param interval Snapshot interval
     * @return CPU usage percentage
     */
    public static float getCpuUsage(int interval) {
        //Log.v("Carat", "Reading cpu usage");
        try {
            RandomAccessFile reader = new RandomAccessFile("/proc/stat", "r");
            int[] data = readLines(reader, 1, 10, "\\s+")[0];
            CPUStats cpu1 = new CPUStats(data); //Snapshot 1
            try {
                Thread.sleep(interval);
            } catch (InterruptedException e) {
                Log.v("Carat", "Failed to poll cpu usage", e);
                return 0;
                // ...
            }
            data = readLines(reader, 1, 10, "\\s+")[0];
            CPUStats cpu2 = new CPUStats(data); //Snapshot 2

            float totaldiff = cpu2.total - cpu1.total;
            if(totaldiff == 0) return 100; // Avoid diving by zero
            float idlediff = cpu2.idleAll - cpu1.idleAll;
            float cpuP = 100*(totaldiff - idlediff)/totaldiff;

            // Disregard negative values caused by a bug in linux kernel
            return (cpuP > 0)? cpuP : 0;
        } catch (IOException e) {
            Log.v("Carat", "Failed reading /proc/stat", e);
            return 0;
        }
    }
    
    
    /**
     * Opens a setting menu.
     * @param setting Setting name, see literals
     * @return True if menu could be opened
     */
    public boolean openSettingMenu(String setting){
        Log.v("Carat", "Opening setting "+setting);
        Intent settingIntent = new Intent();
        
        // Open generic settings activity as a fallback
        if(!settingMap.containsKey(setting)) setting = Settings.ACTION_SETTINGS;
        settingIntent.setAction(setting);
        try{
            activity.startActivity(settingIntent);
            return true;
        } catch(Exception e){
            Log.v("Carat", "Failed to open setting", e);
            return false;
        }
    }

    /**
     * @return True if network is available
     */
    public boolean isNetworkAvailable() {
        ConnectivityManager cm = (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkInfo i = cm.getActiveNetworkInfo();
        return i != null && i.isConnected();
    }

    /**
     * Changes statusbar color on Android 5+ devices.
     * @param colorString Color string, e.g. #F0F0F0
     * @param activity Application activity
     * @return True if action is supported
     */
    public static boolean changeStatusbarColor(String colorString, Activity activity){
        int color = Color.parseColor(colorString);
        Window window = activity.getWindow();
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(color);
            return true;
        }
        return false;
   }

    /**
     * Non-static version of changeStatusbarColor
     * @param color Color value as integer
     * @return True if action is supported
     */
    public boolean changeStatusbarColor(String color){
        return DeviceLibrary.changeStatusbarColor(color, activity);
    }

    // Helper method for reading /stat/proc or meminfo
    private static int[][] readLines(RandomAccessFile reader, int maxRows, int maxColumns, String delim) throws IOException {
        int[][] result = new int[maxRows+1][maxColumns+1];
        for (int row = 0; row < maxRows; row++) {
            String line = reader.readLine();
            if (line == null) break; // EOF
            String[] tokens = line.split(delim);
            for (int column = 0; column < maxColumns; column++) {
                if(maxColumns < tokens.length && TypeUtilities.isInteger(tokens[column])){
                    result[row][column] = Integer.parseInt(tokens[column]);
                } else result[row][column] = 0; // Default to zero
            }
        }
        reader.seek(0); // Rewind
        return result;
    }

}
