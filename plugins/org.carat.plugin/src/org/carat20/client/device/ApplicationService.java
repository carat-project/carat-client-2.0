package org.carat20.client.device;

import android.app.ActivityManager;
import android.app.ActivityManager.RunningAppProcessInfo;
import android.content.Context;
import static android.content.Context.ACTIVITY_SERVICE;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.util.Log;
import java.util.Arrays;


/**
 * Obtain application information and perform tasks.
 * Provides a kill method for terminating running apps.
 * @author Jonatan Hamberg
 */
public class ApplicationService {

    private final Context context;
    ActivityManager am;
    PackageManager pm;

    /**
     * Constructor for ApplicationService.
     * @param context 
     */
    public ApplicationService(Context context) {
        this.context = context;
        this.pm = context.getPackageManager();
        this.am = (ActivityManager) context.getSystemService(ACTIVITY_SERVICE);
    }
    
    /**
     * Returns application information used for flags.
     * @param packageName Application package name.
     * @return ApplicationInfo
     */
    public ApplicationInfo getAppInfo(String packageName){
        try{
            return context.getPackageManager().getApplicationInfo(packageName, 0);
        } catch (NameNotFoundException e){
            Log.v("Carat", "No application info found for "+packageName);
        }
        return null;
    }

    /**
     * @param packageName Application package name
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
    public boolean isAppRemovable(String packageName){
        ApplicationInfo appInfo = getAppInfo(packageName);
        if(appInfo == null) return false;
        return !isSystem(appInfo);
    }

    /**
     * Determines if processes belonging to package can be terminated.
     * Checks if package is a system app, persistent or blacklisted.
     * @param packageName Application package name.
     * @return True if application can be killed.
     */
    public boolean isAppKillable(String packageName) {
        ApplicationInfo appInfo = getAppInfo(packageName);
        if(appInfo == null) return false;
        return !(isSystem(appInfo) 
                || isPersistent(appInfo)
                || isIgnored(appInfo));
    }
    
    /**
     * Terminates processes belonging to the package.
     * @param packageName Application package name.
     * @return True if application was terminated.
     */
    public boolean killApp(String packageName) {
        if(!isAppRunning(packageName)) return false;
        try{
            am.killBackgroundProcesses(packageName);
            return true;
        } catch (Throwable th){
            Log.v("Carat","Process could not be killed: " + packageName);
        }
        return false;
    }

    // Detect system applications
    private boolean isSystem(ApplicationInfo app) {
        return (app.flags & ApplicationInfo.FLAG_SYSTEM) !=0 || 
               (app.flags & ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) !=0;
    }
    
    // Detect applications that are running at all times
    private boolean isPersistent(ApplicationInfo info){
        return (info.flags & ApplicationInfo.FLAG_PERSISTENT) != 0;
    }
    
    // Detect blacklisted applications
    private boolean isIgnored(ApplicationInfo info){
        // ...
        return false;
    }
}
