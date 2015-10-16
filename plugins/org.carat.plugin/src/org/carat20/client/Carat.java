package org.carat20.client;

import android.app.Activity;
import android.content.Context;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import java.util.HashMap;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.carat20.client.Constants.ActionType;
import org.carat20.client.device.ApplicationLibrary;
import org.carat20.client.device.DeviceLibrary;

import static org.carat20.client.Constants.*;
import org.carat20.client.protocol.CommunicationManager;
import org.carat20.client.storage.DataStorage;
import org.carat20.client.storage.SimpleHogBug;
import org.carat20.client.thrift.Reports;
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
    private static ApplicationLibrary appService;
    private static Context context;
    private static Activity activity;
    
    private Reports mainReports;
    private SimpleHogBug[] hogReports;
    private SimpleHogBug[] bugReports;

    /**
     * This initialization method gets executed before anything else
     * @param cordova Activity interface with access to application context
     * @param webView Main interface for interacting with Cordova webView
     */
    @Override
    public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
        Log.v("Carat", "Plugin is initializing");
        super.initialize(cordova, webView);
        
        // ...
    }

    /**
     * Executes different tasks based on action calls from cordova exec.
     * Tasks include plugin initialization, fetching data and handling
     * processes. Data is returned to a callback function from webview.
     *
     * @param action Determines the task.
     * @param args Optional action arguments.
     * @param cb Used for returning data to webview.
     * @return True when action is properly executed.
     */
    @Override
    public boolean execute(final String action, final JSONArray args, final CallbackContext cb) {
        Log.v("Carat", "Received action " + action);
        
        // Use threading to avoid blocking rendering
        cordova.getThreadPool().execute(new Runnable(){
            @Override
            public void run() {
                // Tasks
                switch(ActionType.get(action)){
                    case INIT:      handleInit(cb);         break;
                    case JSCORE:    handleJscore(cb);       break;
                    case MAIN:      handleMain(cb);         break;
                    case HOGS:      handleHogs(cb);         break;
                    case BUGS:      handleBugs(cb);         break;
                    case MEMORY:    handleMemory(cb);       break;
                    case KILL:      handleKill(cb, args);   break;
                    case REMOVE:    handleRem(cb, args);    break;
                    default: cb.error("No such action");
                }
            }
        });
        return true;
    }

    /**
     * Prepares context, storage and communication manager for use.
     * This method should run before any calls to execute.
     * 
     * It works in the following manner:
     * 1. Pull application context from Cordova, used for storage access.
     * 2. Initialize storage and read reports from disk. Returns an exception 
     * when no data has been fetched yet.
     * 3. Create communication manager and refresh needed data. This is done 
     * in a separate thread to avoid blocking WebCore.
     * 
     * Ideally the storage should contain all reports after these steps.
     */
    public void prepareData(){
        Log.v("Carat", "Plugin is preparing data");
        context = cordova.getActivity().getApplicationContext();
        activity = cordova.getActivity();
        
        int appResId = cordova.getActivity().getResources().getIdentifier(
                "uuid", 
                "string", 
                cordova.getActivity().getPackageName()
        );
        
        String uuid = cordova.getActivity().getString(appResId);
        Log.v("Carat", "Using uuid: "+uuid);
        
        storage = new DataStorage(context);
        commManager = new CommunicationManager(storage, uuid);
        appService = new ApplicationLibrary(activity);
        
        cordova.getThreadPool().execute(new Runnable() {
            @Override
            public void run() {
                //No data
                if(storage.isEmpty()){
                    Log.v("Carat", "Storages are empty, refreshing all reports");
                    commManager.refreshAllReports();
                }
                //Missing data
                else if (!storage.isComplete()){
                    Log.v("Carat", "Some storages are empty, refreshing");
                    if(storage.getMainReports() == null) commManager.refreshMainReports();
                    if(storage.getHogReports() == null) commManager.refreshHogsBugs("hogs");
                    if(storage.getBugReports() == null) commManager.refreshHogsBugs("bugs");
                } else {
                    Log.v("Carat", "Storages are complete and ready to go");
                }
                //Forget about the bridge
                cordova.getActivity().runOnUiThread(new Runnable() {
                    @Override
                    public void run() {
                        sendEvent("dataready");
                    }
                });
            }
        });
        Log.v("Carat", "Completed initialization phase");
    }

    /**
     * Invokes a webview event.
     * @param event String representation.
     */
    public void sendEvent(String event){
        Log.v("Carat", "Sending " + event + " to webView");
        webView.loadUrl(
                "javascript:cordova.fireDocumentEvent('"+event+"');"
        );
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
    
    // Init
    private void handleInit(CallbackContext cb){
         Log.v("Carat", "Initializing plugin");
         prepareData();
         cb.success();
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
    
    // Memory info
    private void handleMemory(CallbackContext cb){
        HashMap<String, Integer> memInfo = DeviceLibrary.getMemoryInfo();
        if (memInfo == null) return;
        Log.v("Carat", "memInfo is " + memInfo);
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
            if(appService.killApp(packageName)){
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
            if(appService.openAppDetails(packageName)){
                cb.success("Success");
            } else {
                cb.error("Failed");
            }
        } catch (JSONException e){
             Log.v("Carat", "Failed to open app details, invalid package name.", e);
        }
        cb.success();
    }
    
    
    // Utility methods for converting data to JSON.
    
    /**
     * Creates a JSON array for hog or bug reports
     * @param reports Hogs/bugs in a list
     * @return JSONArray Containing each report as a JSONObject
     * @throws JSONException Object or array cannot be created
     */
    public JSONArray convertToJSON(SimpleHogBug[] reports) throws JSONException{
        Log.v("Carat", "Converting hog/bug reports to JSON");
        JSONArray results = new JSONArray();
        for(SimpleHogBug s : reports){
            String packageName = s.getAppName();
            
            //Ignore apps that are not installed or exceed the error limit.
            if(!appService.isAppInstalled(packageName) 
                    || s.getErrorRatio() > ERROR_LIMIT) continue;
            
            JSONObject app = new JSONObject()
                //Static
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
                .put("running", appService.isAppRunning(packageName))
                .put("killable", appService.isAppKillable(packageName))
                .put("removable", appService.isAppRemovable(packageName));
            results.put(app);
        }
        return results;
    }
    
    /**
     * Creates a JSON object for main reports.
     * @param r Main reports
     * @return JSONObject containing main report data
     * @throws JSONException Object cannot be created
     */
    public JSONObject convertToJSON(Reports r) throws JSONException{
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
            .put("similarAppsWithout", r.similarAppsWithout);
        return results;
    }
}
