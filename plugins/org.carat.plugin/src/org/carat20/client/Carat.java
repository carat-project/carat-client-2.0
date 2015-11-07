package org.carat20.client;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.os.Build;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import android.view.Gravity;
import android.view.Window;
import android.view.WindowManager;
import android.widget.Toast;
import java.util.HashMap;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.carat20.client.Constants.ActionType;
import org.carat20.client.device.ApplicationLibrary;
import org.carat20.client.device.DeviceLibrary;

import static org.carat20.client.Constants.*;
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
        Window window = activity.getWindow();
        if(Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            int color = Color.parseColor(preferences.getString("StatusBarBackgroundColor", "#000000"));
            window.clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(color);
        }
        
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
        
        // Use threading to avoid blocking rendering
        cordova.getThreadPool().execute(new Runnable(){
            @Override
            public void run() {
                // Tasks
                switch(ActionType.get(action)){
                    // Management
                    case SETUP:     handleSetup(cb);        break;
                    case CLEAR:     handleClear(cb);        break;
                    case REFRESH:   handleRefresh(cb);      break;
                    case UUID:      handleUuid(cb, args);   break;
                    
                    // Data
                    case JSCORE:    handleJscore(cb);       break;
                    case MAIN:      handleMain(cb);         break;
                    case HOGS:      handleHogs(cb);         break;
                    case BUGS:      handleBugs(cb);         break;
                    case MEMORY:    handleMemory(cb);       break;
                    case SETTINGS:  handleSettings(cb);     break;
                        
                    // Actions
                    case KILL:      handleKill(cb, args);   break;
                    case REMOVE:    handleRem(cb, args);    break;
                    case CPU:       handleCPU(cb);          break;
                    case TOAST:     handleToast(cb, args);  break;
                    case NOTIFY:    handleNotify(cb, args); break;
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
    
    // Handle action
    
    /**
     * Initializes application context and storage.
     * @param cb Callback for sending success.
     */
    public void handleSetup(CallbackContext cb){
        Log.v("Carat", "Setting up storage");
        activity = cordova.getActivity();
        context = activity.getApplicationContext();
        intent = activity.getIntent();
        storage = new DataStorage(context);
        applicationLibrary = new ApplicationLibrary(activity);
        deviceLibrary = new DeviceLibrary(context, intent);
        cb.success();
    }
    
    // Clear storage
    private void handleClear(CallbackContext cb){
        Log.v("Carat", "Clearing storage");
        storage.clearData();
        if(storage.isEmpty()){
            cb.success();
        } else {
            Log.v("Carat", "Failed to clear storage.");
        }
    }
    
    // Refresh data in storages
    private void handleRefresh(CallbackContext cb){
        Log.v("Carat", "Refreshing data");
        uuid = storage.getUuid();
        
        // Use plugin.xml value if we have no uuid
        if(uuid == null || uuid.isEmpty()){  
            uuid = readConfig("uuid");
            Log.v("Carat", "Using default uuid "+uuid);
            storage.writeUuid(uuid);
        } else {
            Log.v("Carat", "Using custom uuid "+uuid);
        }
        
        commManager = new CommunicationManager(storage, uuid);
        
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                // No data
                if(storage.isEmpty()){
                    Log.v("Carat", "Storage is empty, fetching reports..");
                    commManager.refreshAllReports();
                }
                // Missing data
                else if (!storage.isComplete()){
                    Log.v("Carat", "Storage is incomplete, fetching missing reports..");
                    if(storage.getMainReports() == null) commManager.refreshMainReports();
                    if(storage.getHogReports() == null) commManager.refreshHogsBugs("hogs");
                    if(storage.getBugReports() == null) commManager.refreshHogsBugs("bugs");
                    if(storage.getBugReports() == null) commManager.refreshSettings();
                } else {
                    Log.v("Carat", "Storage is complete and ready to go");
                }
                // Send dataready event when storage is ready
                activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        sendEvent("dataready");
                    }
                });
            }
        });
    }
    
    // Combined method for getting and setting uuid
    private void handleUuid(CallbackContext cb, JSONArray args){
        // Check args just in case
        try {
            uuid = (String) args.get(0);
        } catch (JSONException e) {
            uuid = "";
        }
        
        // When no uuid is specified..
        if(uuid.equals("get")){
            // .. use the one in storage..
            uuid = storage.getUuid();
            // .. and if there is no uuid stored..
            if(uuid == null || uuid.isEmpty()){
                // .. return an empty string
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
    private void handleJscore(CallbackContext cc){
        int jscore = (int)(storage.getMainReports().getJScore() * 100);
        cc.success(jscore);
    }
    
    // Main reports
    private void handleMain(CallbackContext cb){
        try{
            mainReports = storage.getMainReports();
            cb.success(convertToJSON(mainReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert main reports.", e);
        }
    }
    
    // Hog reports
    private void handleHogs(CallbackContext cb){
        try{
            hogReports = storage.getHogReports();
            cb.success(convertToJSON(hogReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert hog reports.", e);
        }
    }
    
    // Bug reports
    private void handleBugs(CallbackContext cb){
        try{
            bugReports = storage.getBugReports();
            cb.success(convertToJSON(bugReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert bug reports.", e);
        }
    }
    
    
    
    private void handleSettings(CallbackContext cb){
        try {
            HashMap<String, Object> deviceInfo = deviceLibrary.getDeviceInfo();
            if(deviceInfo == null) return;
            EVTree tree = storage.getSettingsTree();
            if(tree == null) return;
            settingsReports = tree.getSuggestions(deviceInfo);
            if(settingsReports == null) return;
            cb.success(convertToJSON(settingsReports));
        } catch (JSONException e){
            Log.v("Carat", "Failed to convert settings.", e);
        }
    }
    
    // Memory info
    private void handleMemory(CallbackContext cb){
        HashMap<String, Integer> memInfo = DeviceLibrary.getMemoryInfo();
        if (memInfo == null) return;
        try{
            int freeMem = memInfo.get("free");
            int cachedMem = memInfo.get("cached");
            
            // MemoryInfo.availMem = MemFree + Cached 
            int availMem = freeMem + cachedMem;
            JSONObject result = new JSONObject()
                .put("total", memInfo.get("total"))
                .put("available", availMem)
                .put("free", freeMem)
                .put("cached", cachedMem)
                .put("active", memInfo.get("active"))
                .put("inactive", memInfo.get("inactive"));
            cb.success(result);
        } catch(JSONException e){
            Log.v("Carat", "Failed to convert memory info", e);
        }
    }
    
    // Kill application
    private void handleKill(CallbackContext cb, JSONArray args){
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
    private void handleRem(CallbackContext cb, JSONArray args){
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
    
    // Get cpu usage while keeping callback
    private void handleCPU(final CallbackContext cb){
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                String cpuUsage = String.format("%.1f", DeviceLibrary.getCpuUsage(1000));
                PluginResult result = new PluginResult(PluginResult.Status.OK, cpuUsage);
                result.setKeepCallback(true); // Keep sending results
                cb.sendPluginResult(result);
            }
        });
    }
    
    // Show a toast message
    private void handleToast(final CallbackContext cb, final JSONArray args){
        try {
            final String message = (String) args.get(0);
            activity.runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        Toast toast = Toast.makeText(context, message, Toast.LENGTH_SHORT);
                        toast.setGravity(Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL, 0, 20);
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
    private void handleNotify(CallbackContext cb, final JSONArray args){
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
    
    // Utility methods for converting data to JSON.
    
    /**
     * Creates a JSON array for hog or bug reports.
     * @param reports Hogs/bugs in a list.
     * @return JSONArray with reports as JSONObjects.
     * @throws org.json.JSONException
     */
    public JSONArray convertToJSON(SimpleHogBug[] reports) throws JSONException{
        Log.v("Carat", "Converting hog/bug reports to JSON");
        JSONArray results = new JSONArray();
        for(SimpleHogBug s : reports){
            String packageName = s.getAppName();
            
            //Ignore apps that are not installed or exceed the error limit.
            if(!applicationLibrary.isAppInstalled(packageName) 
                    || s.getErrorRatio() > ERROR_LIMIT) continue;
            
            JSONObject app = new JSONObject()
                // Static
                .put("type", s.getType())
                .put("label", s.getAppLabel())
                .put("name", packageName)
                .put("benefit",s.getBenefitText())
                .put("priority",s.getAppPriority())
                .put("samples", s.getSamples())
                .put("samplesWithout", s.getSamplesWithout())
                .put("expected", s.getExpectedValue())
                .put("expectedWithout", s.getExpectedValueWithout())
                .put("icon", s.getAppIcon())

                 // Dynamic
                .put("version", applicationLibrary.getAppVersion(packageName))
                .put("running", applicationLibrary.isAppRunning(packageName))
                .put("killable", applicationLibrary.isAppKillable(packageName))
                .put("removable", applicationLibrary.isAppRemovable(packageName));
            results.put(app);
        }
        return results;
    }
    
    public JSONArray convertToJSON(SimpleSettings[] settings) throws JSONException {
        JSONArray results = new JSONArray();
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
        int errorMinutes = 0;
        if(error > 7200){
            errorHours = (int)(error / 3600);
            error -= errorHours * 3600;
        }
        errorMinutes = (int)(error / 60);
        return batteryHours + "h "+
               batteryMinutes+"m \u00B1 "+ 
               (errorHours > 0 ? errorHours + "h ": "") + 
               errorMinutes + " m"; 
    }
}
