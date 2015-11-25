package org.carat20.client;

import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Point;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import android.view.Display;
import android.view.Gravity;
import android.widget.Toast;
import java.util.HashMap;
import java.util.concurrent.ScheduledThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.carat20.client.Constants.ActionType;
import org.carat20.client.device.ApplicationLibrary;
import org.carat20.client.device.DeviceLibrary;

import static org.carat20.client.Constants.*;
import org.carat20.client.device.MemoryStats;
import org.carat20.client.protocol.CommunicationManager;
import org.carat20.client.storage.DataStorage;
import org.carat20.client.storage.EVTree;
import org.carat20.client.storage.SimpleHogBug;
import org.carat20.client.storage.SimpleSettings;
import org.carat20.client.thrift.Reports;
import org.carat20.client.utility.Range;
import org.json.JSONObject;


/**
 * This class acts as the middleware between Cordova and native functions of Carat. 
 * It is responsible for initializing storages and routing requested data.
 * Communication with javascript happens through the execute method.
 * 
 * @see <a href="http://cordova.apache.org/docs/en/5.0.0/">Cordova</a>.
 *
 * @author Jonatan Hamberg
 * @see CommunicationManager
 * @see DataStorage
 */
public class Carat extends CordovaPlugin {

    private static DataStorage storage;
    private static CommunicationManager commManager;
    private static ApplicationLibrary applicationLibrary;
    private static DeviceLibrary deviceLibrary;
    private static Context context;
    private static Intent intent;
    private static Activity activity;
    
    private Reports mainReports;
    private SimpleHogBug[] hogReports;
    private SimpleHogBug[] bugReports;
    private SimpleSettings[] settingsReports;
    
    private String uuid;

    /**
     * This initialization method gets executed before anything else
     * @param cordova Activity interface with access to application context
     * @param webView Main interface for interacting with Cordova webView
     */
    @Override
    public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
        Log.v("Carat", "Plugin is initializing");
        super.initialize(cordova, webView);
        Carat.activity = cordova.getActivity();
        String color = preferences.getString("StatusBarBackgroundColor", "#000000");
        DeviceLibrary.changeStatusbarColor(color, activity);
        // ...
    }

    /**
     * Executes different tasks based on action calls from cordova exec.
     * Tasks include plugin initialization, fetching data and handling
     * processes. Data is returned to a callback function in webview.
     *
     * @param action action name
     * @param args arguments
     * @param cb cordova callbackcontext
     * @return True when action is properly executed.
     */
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext cb) {
        Log.v("Carat", "Executing action: " + action);
        
        // Avoid blocking uithread
        cordova.getThreadPool().execute(new Runnable(){
            @Override
            public void run() {
                // Tasks
                switch(ActionType.get(action)){
                    // Management
                    case SETUP:     setupPlugin(cb);            break;
                    case CLEAR:     clearStorage(cb);           break;
                    case REFRESH:   refreshStorages(cb);        break;
                    case UUID:      handleUuid(cb, args);       break;
                    
                    // Data
                    case JSCORE:    getJscore(cb);              break;
                    case MAIN:      getMainReports(cb);         break;
                    case HOGS:      getHogs(cb);                break;
                    case BUGS:      getBugs(cb);                break;
                    case MEMORY:    getMemoryInfo(cb);          break;
                    case SETTINGS:  getSettings(cb);            break;
                        
                    // Actions
                    case KILL:      killApp(cb, args);          break;
                    case REMOVE:    removeApp(cb, args);        break;
                    case TOAST:     showToast(cb, args);        break;
                    case NOTIFY:    notification(cb, args);     break;
                    case COLOR:     setStatusColor(cb, args);   break;
                        
                    // Polling
                    case CPUPOLL:   pollCPU(cb ,args);          break;
                    case MEMPOLL:   pollMemory(cb ,args);       break;
                        
                    default: cb.error("No such action");
                }
            }
        });
        return true;
    }

    /**
     * Refresh data on resume
     * @param multitasking 
     */
    @Override
    public void onResume(boolean multitasking) {
        //...
    }
    
    // Handle actions
    
    /**
     * Initializes application context and storage.
     * @param cb Callback for sending success.
     */
    public void setupPlugin(CallbackContext cb){
        Log.v("Carat", "Setting up storage");
        activity = cordova.getActivity();
        context = activity.getApplicationContext();
        intent = activity.getIntent();
        applicationLibrary = new ApplicationLibrary(activity);
        storage = new DataStorage(context, applicationLibrary);
        deviceLibrary = new DeviceLibrary(context, intent, activity);
        cb.success();
    }
    
    // Clear storage
    private void clearStorage(CallbackContext cb){
        Log.v("Carat", "Clearing storage");
        storage.clearData();
        if(storage.isEmpty()){
            cb.success();
        } else {
            Log.v("Carat", "Failed to clear storage.");
        }
    }
    
    // Refresh data in storages
    private void refreshStorages(CallbackContext cb){
        Log.v("Carat", "Refreshing data");
        uuid = storage.getUuid();
        
        // Use plugin.xml value if we have no uuid
        if(uuid == null || uuid.isEmpty()){  
            uuid = readConfig("uuid");
            storage.writeUuid(uuid);
        }
        
        Log.v("Carat", "Using uuid "+uuid);
        commManager = new CommunicationManager(storage, uuid);
        
        // Reload data if storage isn't complete
        if(!storage.isComplete() && deviceLibrary.isNetworkAvailable()) {
            Log.v("Carat", "Storage is empty or incomplete, fetching reports..");
            
            // Fetch data from server
            sendPluginResult(cb, "Updating system");
            commManager.refreshMainReports();
            sendPluginResult(cb, "Updating hogs");
            commManager.refreshHogsBugs("Hog");
            sendPluginResult(cb, "Updating bugs");
            commManager.refreshHogsBugs("Bug");
            sendPluginResult(cb, "Updating settings");
            commManager.refreshSettings();
        } 
        
        // Let webview know we're ready
        cb.success("READY");
    }
    
    // Combined method for getting and setting uuid
    private void handleUuid(CallbackContext cb, JSONArray args){
        // Check args just in case
        try {
            uuid = (String) args.get(0);
        } catch (JSONException e) {
            uuid = "";
        }
        if(uuid.equals("get")){
            // Fetch from storage
            uuid = storage.getUuid();
            if(uuid == null || uuid.isEmpty()){
                cb.success("");
            }
        } else {
            Log.v("Carat", "Saving uuid " + uuid +" in storage");
            storage.writeUuid(uuid);
        }
        // Return uuid
        cb.success(uuid);
    }
    
    // Jscore
    private void getJscore(CallbackContext cc){
        int jscore = (int)(storage.getMainReports().getJScore() * 100);
        cc.success(jscore);
    }
    
    // Main reports
    private void getMainReports(CallbackContext cb){
        try{
            mainReports = storage.getMainReports();
            cb.success(convertToJSON(mainReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert main reports.", e);
        }
    }
    
    // Hog reports
    private void getHogs(CallbackContext cb){
        try{
            hogReports = storage.getHogReports();
            cb.success(convertToJSON(hogReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert hog reports.", e);
        }
    }
    
    // Bug reports
    private void getBugs(CallbackContext cb){
        try{
            bugReports = storage.getBugReports();
            cb.success(convertToJSON(bugReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert bug reports.", e);
        }
    }
    
    // System setting suggestions
    private void getSettings(CallbackContext cb){
        try {
            HashMap<String, Object> deviceInfo = deviceLibrary.getDeviceInfo();
            if(deviceInfo == null){
                cb.error(new JSONObject());
                return;
            }
            EVTree tree = storage.getSettingsTree();
            if(tree == null){
                cb.error(new JSONObject());
                return;
            }
            settingsReports = tree.getSuggestions(deviceInfo);
            cb.success(convertToJSON(settingsReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert settings.", e);
        }
    }
    
    // Memory info
    private void getMemoryInfo(CallbackContext cb){
        MemoryStats memStats = DeviceLibrary.getMemoryStats();
        if (memStats == null) return;
        try{
            JSONObject result = new JSONObject()
                .put("total", memStats.total)
                .put("available", memStats.available)
                .put("free", memStats.free)
                .put("cached", memStats.cached)
                .put("active", memStats.active)
                .put("inactive", memStats.inactive);
            cb.success(result);
        } catch(JSONException e){
            Log.v("Carat", "Failed to convert memory info", e);
        }
    }
    
    // Kill application
    private void killApp(CallbackContext cb, JSONArray args){
        try{
            String packageName = (String) args.get(0);
            if(applicationLibrary.killApp(packageName)){
                cb.success("Success");
            } else {
                cb.error("Failed");
            }
        } catch (JSONException e){
            Log.v("Carat", "Failed to kill app, invalid package name.", e);
        }
        cb.error("Failed to kill app, invalid package name.");
    }
    
    // Open application details to proceed with uninstalling
    private void removeApp(CallbackContext cb, JSONArray args){
        try{
            String packageName = (String) args.get(0);
            if(applicationLibrary.openAppDetails(packageName)){
                cb.success("Success");
            } else {
                cb.error("Failed");
            }
        } catch (JSONException e){
             Log.v("Carat", "Failed to open app details, invalid package name.", e);
        }
        cb.success();
    }
    
    // CPU usage polling
    private void pollCPU(final CallbackContext cb, final JSONArray args){
        Log.v("Carat", "Starting cpu polling");
        try {
            final int interval = (Integer) args.get(0);
            final ScheduledThreadPoolExecutor exec = new ScheduledThreadPoolExecutor(1);
            exec.schedule(new Runnable(){
                @Override
                public void run() {
                    long time = System.currentTimeMillis();
                    String cpuUsage = String.format("%.1f", DeviceLibrary.getCpuUsage(2000));
                    sendPluginResult(cb, cpuUsage);
                    
                    // Consider elapsed processing time when scheduling next task
                    long nextDelay = interval-(System.currentTimeMillis()-time);
                    exec.schedule(this, (nextDelay < 0) ? 0 : nextDelay, TimeUnit.MILLISECONDS);
                }
            }, 0, TimeUnit.MILLISECONDS);
        } catch (Exception e){
            Log.v("Carat", "Failed polling cpu", e);
        }
    }
    
    // Memory usage polling
    private void pollMemory(final CallbackContext cb, final JSONArray args){
        Log.v("Carat", "Starting memory polling");
        try {
            final int interval = (Integer) args.get(0);
            final ScheduledThreadPoolExecutor exec = new ScheduledThreadPoolExecutor(1);
            exec.schedule(new Runnable(){
                @Override
                public void run() {
                    long time = System.currentTimeMillis();
                    String memUsage = String.format("%.1f", DeviceLibrary.getMemoryUsage());
                    sendPluginResult(cb, memUsage);
                    
                    long nextDelay = interval-(System.currentTimeMillis()-time);
                    exec.schedule(this, (nextDelay < 0) ? 0 : nextDelay, TimeUnit.MILLISECONDS);
                }
            }, 0, TimeUnit.MILLISECONDS);
        } catch (Exception e){
            Log.v("Carat", "Failed polling memory", e);
        }
    }
    
    // Show a toast message
    private void showToast(final CallbackContext cb, final JSONArray args){
        try {
            final String message = (String) args.get(0);
            Display display = activity.getWindowManager().getDefaultDisplay();
            Point size = new Point();
            display.getSize(size);
            final int offset = (int)(size.y*0.05);
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    Toast toast = Toast.makeText(context, message, Toast.LENGTH_SHORT);
                    toast.setGravity(Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL, 0, offset);
                    toast.show();
                    cb.success();
                }
            });
        } catch (JSONException e){
            Log.v("Carat", "Failed to show toast, no message");
            cb.error("Failure");
        }
    }
    
    // Show a local notification
    private void notification(CallbackContext cb, final JSONArray args){
        try{
            String title = args.getString(0);
            String content = args.getString(1);
            DeviceLibrary.showNotification(title, content);
            cb.success();
        } catch (JSONException e){
            Log.v("Carat", "Failed to show notification. Invalid parameters.");
            cb.error("Failure");
        }
    }
    
    // Change statusbar color on versions 5+
    private void setStatusColor(final CallbackContext cb, JSONArray args){
        try {
            final String color = args.getString(0);
            activity.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    deviceLibrary.changeStatusbarColor(color);
                    cb.success();
                }
            });
        } catch (JSONException e){
            Log.v("Carat", "Invalid color specified");
            cb.error("Failure");
        }
    }
    
    /**
     * Reads string values from plugin.xml.
     * @param variable Key.
     * @return Plugin.xml value.
     */
    public String readConfig(String variable){
        int appResId = activity.getResources().getIdentifier(
                variable, 
                "string", 
                activity.getPackageName()
        );
        return activity.getString(appResId);
    }
    
    /**
     * Sends an event to javascript in webview
     * @param event Event name.
     */
    public void sendEvent(String event){
        Log.v("Carat", "Sending " + event + " to webView");
        webView.loadUrl(
                "javascript:cordova.fireDocumentEvent('"+event+"');"
        );
    }
    
    // Sends a plugin result while keeping callback open
    private void sendPluginResult(CallbackContext cb, String value){
        // Get usage and pass to webview
        PluginResult result = new PluginResult(PluginResult.Status.OK, value);
        result.setKeepCallback(true); // Keep sending results
        cb.sendPluginResult(result);
    }
    
    // Utility methods for converting data to JSON.
    
    /**
     * Converts hog/bug reports to a JSON array.
     * @param reports List of hog/bug reports
     * @return JSONArray with reports as JSONObjects.
     * @throws org.json.JSONException
     */
    public JSONArray convertToJSON(SimpleHogBug[] reports) throws JSONException{
        Log.v("Carat", "Converting hog/bug reports to JSON");
        JSONArray results = new JSONArray();
        if(reports == null) return results;
        for(SimpleHogBug s : reports){
            String packageName = s.getAppName();
            
            //Ignore apps that are not installed or exceed the error limit.
            if(!applicationLibrary.isAppInstalled(packageName) 
                    || s.getErrorRatio() > ERROR_LIMIT) continue;
            
            int samples = s.getSamples();
            int samplesWithout = s.getSamplesWithout();
            double samplesPercentage = 100 *(samples / (double)(samples + samplesWithout));
            String popularity = String.format("%.3f",  samplesPercentage);
            
            JSONObject app = new JSONObject()
                .put("type", s.getType())
                .put("label", s.getAppLabel())
                .put("name", packageName)
                .put("benefit",s.getBenefitText())
                .put("priority",s.getAppPriority())
                .put("samples", samples)
                .put("samplesWithout", samplesWithout)
                .put("popularity", popularity)
                    
                .put("version", applicationLibrary.getAppVersion(packageName))
                .put("running", applicationLibrary.isAppRunning(packageName))
                .put("killable", applicationLibrary.isAppKillable(packageName))
                .put("removable", applicationLibrary.isAppRemovable(packageName))
                .put("system", applicationLibrary.isAppSystem(packageName))
                    
                .put("icon", s.getAppIcon());
            results.put(app);
        }
        return results;
    }
    
    /**
     * Converts system setting suggestions to a JSON array.
     * @param settings List of setting suggestions
     * @return JSONArray with suggestions as JSONObjects
     * @throws JSONException 
     */
    public JSONArray convertToJSON(SimpleSettings[] settings) throws JSONException {
        JSONArray results = new JSONArray();
        if(settings == null) return results;
        for(SimpleSettings s : settings){
            //if(s.getErrorRatio() > ERROR_LIMIT) continue;
            
            JSONObject setting = new JSONObject()
            .put("label", s.getLabel())
            .put("current", s.getValue());
            Object value = s.getValueWithout();
             if(value instanceof Range){
                 Range valueRange = (Range) value;
                 JSONObject range = new JSONObject()
                         .put("min", valueRange.getMin())
                         .put("max", valueRange.getMax());
                 setting.put("changeTo", range);
             } else setting.put("changeTo", value)    
            .put("benefit", s.getBenefitText());
            results.put(setting);
        }
        return results;
    }
    
    /**
     * Creates a JSON object for main reports.
     * @param r Main reports.
     * @return JSONObject containing main reports.
     * @throws org.json.JSONException
     */
    public JSONObject convertToJSON(Reports r) throws JSONException{
        if(r == null) return new JSONObject();
        final String batteryLife = this.getBatteryLife(r);
        
        Log.v("Converting main reports to JSON", r.toString());
        JSONObject results = new JSONObject()
            .put("jscore", r.getJScore())
            .put("jscoreWith", r.getJScore())
            .put("jscoreWithout", r.jScoreWithout)
            .put("os", r.os)
            .put("osWithout", r.osWithout)
            .put("model",r.model)
            .put("modelWithout", r.modelWithout)
            .put("similarApps", r.similarApps)
            .put("similarAppsWithout", r.similarAppsWithout)
            .put("batteryLife", batteryLife);
        return results;
    }
    
    // Calculate estimated battery life
    private String getBatteryLife(Reports r) {
        double batteryLife = 0;
        double error = 0;
        if(r.jScoreWith != null){
            double exp = r.jScoreWith.expectedValue;
            if(exp > 0.0){
                batteryLife = 100 / exp;
                error = 100 / (exp + r.jScoreWith.error);
            } else if (r.getModel() != null){
                exp = r.getModel().expectedValue;
                if(exp > 0.0){
                    batteryLife = 100/exp;
                    error = 100 / (exp + r.getModel().error);
                }
            }
        }
        error = batteryLife - error;
        int batteryHours = (int)(batteryLife / 3600);
        batteryLife -= batteryHours * 3600;
        int batteryMinutes = (int)(batteryLife / 60);
        
        int errorHours = 0;
        if(error > 7200){
            errorHours = (int)(error / 3600);
            error -= errorHours * 3600;
        }
        int errorMinutes = (int)(error / 60);
        return batteryHours + "h "+
               batteryMinutes+"m \u00B1 "+ 
               (errorHours > 0 ? errorHours + "h ": "") + 
               errorMinutes + " m"; 
    }
}
