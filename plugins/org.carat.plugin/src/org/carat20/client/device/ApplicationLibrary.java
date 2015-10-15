package org.carat20.client.device;

import android.app.Activity;
import android.app.ActivityManager;
import android.app.ActivityManager.RunningAppProcessInfo;
import android.content.Context;
import static android.content.Context.ACTIVITY_SERVICE;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Log;
import java.util.Arrays;

/**
 * Provides application information and performs tasks. 
 * Tasks include killing apps and opening views.
 *
 * @author Jonatan Hamberg
 */
public class ApplicationLibrary {

    
    private final Activity activity;
    private final Context context;
    private final ActivityManager am;
    private final PackageManager pm;

    /**
     * Constructor for ApplicationService.
     *
     * @param activity Cordova activity.
     */
    public ApplicationLibrary(Activity activity) {
        this.activity = activity;
        this.context = activity.getApplicationContext();
        this.pm = context.getPackageManager();
        this.am = (ActivityManager) context.getSystemService(ACTIVITY_SERVICE);
    }

    /**
     * Returns application information used for flags.
     *
     * @param packageName Application package name.
     * @return ApplicationInfo
     */
    public ApplicationInfo getAppInfo(String packageName) {
        try {
            return pm.getApplicationInfo(packageName, 0);
        } catch (NameNotFoundException e) {
            Log.v("Carat", "No application info found for " + packageName);
        }
        return null;
    }

    /**
     * Returns whether the application is installed on device.
     *
     * @param packageName Application package name.
     * @return True if application is installed.
     */
    public boolean isAppInstalled(String packageName) {
        try {
            pm.getPackageInfo(packageName, 0);
        } catch (NameNotFoundException e) {
            return false;
        }
        return true;
    }

    /**
     * @param packageName Application package name.
     * @return True if the application is running.
     */
    public boolean isAppRunning(String packageName) {
        for (RunningAppProcessInfo pid : am.getRunningAppProcesses()) {
            // Process can have multiple packages
            if (Arrays.asList(pid.pkgList).contains(packageName)) {
                return true;
            }
        }
        return false;
    }

    /**
     * @param packageName Application package name.
     * @return True if application can be uninstalled.
     */
    public boolean isAppRemovable(String packageName) {
        ApplicationInfo appInfo = getAppInfo(packageName);
        if (appInfo == null) {
            return false;
        }
        return !isSystem(appInfo);
    }

    /**
     * Determines if process belonging to package can be terminated. Checks if
     * package is a system app, persistent or blacklisted.
     *
     * @param packageName Application package name.
     * @return True if application can be killed.
     */
    public boolean isAppKillable(String packageName) {
        ApplicationInfo appInfo = getAppInfo(packageName);
        if (appInfo == null) {
            return false;
        }
        
        // Allow killing system apps for now
        return !(//isSystem(appInfo)  || 
                isPersistent(appInfo) || 
                isIgnored(appInfo));
    }

    /**
     * Terminates processes belonging to the package.
     *
     * @param packageName Application package name.
     * @return True if application was terminated.
     */
    public boolean killApp(String packageName) {
        if (!isAppRunning(packageName)) {
            return false;
        }
        try {
            am.killBackgroundProcesses(packageName);
            Log.v("Carat", "Killed process " + packageName);
            return true;
        } catch (Throwable th) {
            Log.v("Carat", "Process could not be killed: " + packageName);
        }
        return false;
    }

    /**
     * Opens application details view in settings.
     * This is used to avoid excessive permissions.
     *
     * @param packageName Application package name.
     */
    public boolean openAppDetails(String packageName) {
        Intent intent = new Intent();
        final int sdkLevel = Build.VERSION.SDK_INT;
        
        // API levels greater or equal than 9
        if (sdkLevel >= Build.VERSION_CODES.GINGERBREAD) {
            intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            Uri uri = Uri.fromParts("package", packageName, null);
            intent.setData(uri);
        } else {
            //API levels 8 and below
            final String extension = (sdkLevel == Build.VERSION_CODES.FROYO
                    ? "pkg"
                    : "com.android.settings.ApplicationPkgName");
            intent.setAction(Intent.ACTION_VIEW);
            intent.setClassName(
                    "com.android.settings",
                    "com.android.settings.InstalledAppDetails"
            );
            //Send information to activity
            intent.putExtra(extension, packageName);
        }
        try{
            activity.startActivity(intent);
        } catch(Exception e){
            Log.v("Carat", "Failed to open application details", e);
            return false;
        }
        return true;
    }

    // Detect system applications
    private boolean isSystem(ApplicationInfo app) {
        return (app.flags & ApplicationInfo.FLAG_SYSTEM) != 0
                || (app.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0;
    }

    // Detect applications that are running at all times
    private boolean isPersistent(ApplicationInfo info) {
        return (info.flags & ApplicationInfo.FLAG_PERSISTENT) != 0;
    }

    // Detect blacklisted applications
    private boolean isIgnored(ApplicationInfo info) {
        // ...
        return false;
    }

}
