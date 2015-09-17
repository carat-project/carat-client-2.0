package org.carat20.client;

import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.PluginResult;
import org.apache.cordova.CallbackContext;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import android.util.Log;

public class Echo extends CordovaPlugin {

    private static final String TAG = "Carat";
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if (action.equals("echo")) {
            String message = args.getString(0);
            callbackContext.success("Hello "+message+"!");
            return true;
        }
        return false;
    }

    @Override
    public void onResume(boolean multitasking) {
        Log.i(TAG, "----> CARAT resumed <----");
    }
}
