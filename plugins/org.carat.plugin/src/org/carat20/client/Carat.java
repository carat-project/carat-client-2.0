package org.carat20.client;

import android.content.Context;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import android.util.Log;
import java.io.ByteArrayOutputStream;
import java.util.Arrays;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;

import org.carat20.client.protocol.CommunicationManager;
import org.carat20.client.storage.DataStorage;
import org.carat20.client.storage.SimpleHogBug;
import org.carat20.client.thrift.Reports;
import org.json.JSONObject;

/**
 * This class acts as the middleware between Phonegap and native functions of
 * Carat. It contains methods necessary for calling the code from Javascript,
 * initializing the background process, refreshing/fetching data and providing
 * the requested data.
 *
 * @author Jonatan Hamberg
 * @see CommunicationManager
 * @see DataStorage
 */
public class Carat extends CordovaPlugin {

    private static DataStorage storage;
    private static CommunicationManager commManager;
    private static Context context;

    private int jscore;
    private Reports mainReports;
    private SimpleHogBug[] hogReports;
    private SimpleHogBug[] bugReports;

    /**
     * Initializes CordovaPlugin and gives early access to CordovaWebView.
     * Creates ByteArrayOutputStream to avoid multiple object references.
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
     * Provides an interface for cordova exec which accepts data requests and
     * fulfills them by either utilizing the server or local storage. Callbacks
     * are mostly used for passing reports to globally accessible Javascript
     * objects. Initialize takes care of data and invokes dataready-event.
     *
     * @param action Determines the function call.
     * @param args Optional information about the request, e.g. events.
     * @param callbackContext Used for returning data to callback functions.
     * @return State boolean, which is true if an action gets executed.
     */
    @Override
    public boolean execute(final String action, JSONArray args, final CallbackContext callbackContext) {
        Log.v("Carat", "Calling action " + action);
        cordova.getThreadPool().execute(new Runnable(){
            @Override
            public void run() {
                try{
                    // Switch action
                    if(action.equals("init")){
                        Log.v("Carat", "Initializing plugin");
                        prepareData();
                        callbackContext.success();
                    } else if(action.equals("jscore")){
                        jscore = (int)(storage.getMainReports().getJScore() * 100);
                        callbackContext.success(
                                jscore
                        );
                    } else if(action.equals("main")){
                        mainReports = storage.getMainReports();
                        callbackContext.success(
                                convertToJSON(mainReports)
                        );
                    } else if(action.equals("hogs")){
                        hogReports = storage.getHogReports();
                        callbackContext.success(
                                convertToJSON(hogReports)
                        );
                    } else if(action.equals("bugs")){
                        bugReports = storage.getBugReports();
                        callbackContext.success(
                                convertToJSON(bugReports)
                        );
                    }    
                    // No matching actions found
                    callbackContext.error("No such action");
                } catch (JSONException e){
                    Log.v("Carat", "JSONException: "+e);
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
     *    when no data has been fetched yet.
     * 3. Create communication manager and refresh needed data. This is done 
     *    in a separate thread to avoid blocking Webcore.
     * 
     * Ideally the storage should contain all reports after these steps.
     */
    public void prepareData(){
        Log.v("Carat", "Plugin is preparing data");
        context = cordova.getActivity().getApplicationContext();
        
        int appResId = cordova.getActivity().getResources().getIdentifier(
                "uuid", 
                "string", 
                cordova.getActivity().getPackageName()
        );
        
        String uuid = cordova.getActivity().getString(appResId);
        Log.v("Carat", "Using uuid: "+uuid);
        
        storage = new DataStorage(context);
        commManager = new CommunicationManager(storage, uuid);
        
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

    }
    
    // Below are some utility methods that should be moved elsewhere
    
    // JSON conversion
    
    /**
     * Creates a JSON array for hog or bug reports
     * @param reports Hogs/bugs in a list
     * @return JSONArray Containing each report as a JSONObject
     * @throws JSONException Object or array cannot be created
     */
    public JSONArray convertToJSON(SimpleHogBug[] reports) throws JSONException{
        Log.v("Converting hog/bug reports to JSON", Arrays.toString(reports));
        JSONArray results = new JSONArray();
        for(SimpleHogBug s : reports){
                String packageName = s.getAppName();
                JSONObject reportObject = new JSONObject()
                        .put("label", s.getAppLabel())
                        .put("icon", this.getBase64Icon(packageName))
                        .put("name", packageName)
                        .put("priority",s.getAppPriority())
                        .put("benefit",s.getBenefitText())
                        .put("samples", s.getSamples())
                        .put("samplesWithout", s.getSamplesWithout())
                        .put("expected", s.getExpectedValue())
                        .put("expectedWithout", s.getExpectedValueWithout())
                        .put("type", s.getType());
                results.put(reportObject);
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
    
    // Drawable resource encoding
    
    /**
     * Return base64 encoded icon PNG from application package.
     * @param packageName Package name.
     * @return Base 64 encoded PNG or an empty string.
     */
    private String getBase64Icon(String packageName){
        try{
            Drawable d = context.getPackageManager().getApplicationIcon(packageName);
            return "data:image/png;base64,"+ encodeIcon(d);
        } catch (PackageManager.NameNotFoundException e){
            return "";
        }
    }
    /**
     * Converts a drawable resource to base64 encoded PNG image.
     * @param icon Drawable image resource.
     * @return Base64 representation of PNG compressed bitmap.
     */
    public static String encodeIcon(Drawable icon){
            if(icon == null) return "";
            
            BitmapDrawable bmDrawable = ((BitmapDrawable) icon);
            Bitmap bitmap = bmDrawable.getBitmap();
            
            bitmap = Bitmap.createScaledBitmap(bitmap, 48, 48, true);
            ByteArrayOutputStream outStream = new ByteArrayOutputStream();
            bitmap.compress(Bitmap.CompressFormat.PNG, 100, outStream);
            byte[] bitmapByte = outStream.toByteArray();

            return Base64.encodeToString(bitmapByte,Base64.DEFAULT);
    }
}
