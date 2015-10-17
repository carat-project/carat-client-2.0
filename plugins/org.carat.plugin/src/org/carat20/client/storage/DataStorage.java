package org.carat20.client.storage;

import android.content.Context;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.content.pm.PackageManager.NameNotFoundException;
import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import android.util.Log;
import java.io.ByteArrayOutputStream;
import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.ObjectInputStream;
import java.io.ObjectOutputStream;
import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import org.carat20.client.Constants;
import org.carat20.client.thrift.HogBugReport;
import org.carat20.client.thrift.HogsBugs;
import org.carat20.client.thrift.Reports;

/**
 * Handles writing and reading reports from memory. It is used to abstract the
 * I/O-operations needed by Carat.
 * 
 * @author Eemil Lagerspetz
 * @author Jonatan Hamberg
 */
public final class DataStorage {

    private final Context context;
    private final PackageManager pm;
    
    private String uuid;
    private WeakReference<Reports> mainReports;
    private WeakReference<SimpleHogBug[]> hogReports;
    private WeakReference<SimpleHogBug[]> bugReports;

    public static final String UUIDFILE = "carat-uuid.dat";
    
    public static final String MAINFILE = "carat-main.dat";
    public static final String HOGFILE = "carat-hogs.dat";
    public static final String BUGFILE = "carat-bugs.dat";

    /**
     * Constructs a storage used for writing and reading reports.
     * Creates references in memory for faster data loading.
     * @param context
     */
    public DataStorage(Context context) {
        this.context = context;
        this.pm = context.getPackageManager();
        
        // Read latest reports to memory
        readMainReports();
        readHogReports();
        readBugReports();
    }
    
    /**
     * Checks if all storage references are null.
     * @return true if all references are null.
     */
    public boolean isEmpty(){
        return (mainReports == null 
                && hogReports == null 
                && bugReports == null);
    }
    
    /**
     * Checks if all references are defined.
     * @return true if all references are defined.
     */
    public boolean isComplete(){
        return !(mainReports == null 
                || hogReports == null 
                || bugReports == null);
    }
    
    public void clearData(){
        context.deleteFile(MAINFILE);
        context.deleteFile(HOGFILE);
        context.deleteFile(BUGFILE);
        mainReports = null;
        hogReports = null;
        bugReports = null;
    }

    /**
     * Checks if uuid reference is null.
     * @return true if uuid is null.
     */
    public boolean uuidEmpty(){
        return (uuid == null);
    }
    
    /**
     * Checks if main reports reference is null. 
     * @return true if mainReports is null.
     */
    public boolean mainEmpty(){
        return (mainReports == null);
    }
    
    /**
     * Checks if hog reports reference is null. 
     * @return true if hogReports is null.
     */
    public boolean hogsEmpty(){
        return (hogReports == null);
    }
    
    /**
     * Checks if bug reports reference is null. 
     * @return true if bugReports is null.
     */
    public boolean bugsEmpty(){
        return (bugReports == null);
    }
    
    /**
     * Provides uuid from memory or storage.
     * @return User identifier uuid.
     */
    public String getUuid() {
        return (uuid != null) ? uuid : readUuid();
    }
    
    /**
     * Provides main reports from reference or storage.
     * Storage is used if references are not in memory.
     * @return Main reports.
     */
    public Reports getMainReports() {
        Log.v("Carat", "Getting main reports");
        return (mainReports != null && mainReports.get() != null) ?
                mainReports.get() : readMainReports();
    }
    
    /**
     * Provides hog reports from reference or storage.
     * Storage is used if references are not in memory.
     * @return Hog reports.
     */    
    public SimpleHogBug[] getHogReports() {
        Log.v("Carat", "Getting hog reports");
        return (hogReports != null && hogReports.get() != null) ? 
                hogReports.get() : readHogReports();
    }
    
    /**
     * Provides bug reports from reference or storage.
     * Storage is used if references are not in memory.
     * @return Bug reports.
     */
    public SimpleHogBug[] getBugReports() {
       Log.v("Carat", "Getting bug reports");
       return (bugReports != null && bugReports.get() != null) ? 
                bugReports.get() : readBugReports();
    }
    
    //Reads uuid from file.
    private String readUuid() {
        Log.v("Carat", "Reading uuid from disk");
        String text = readText(UUIDFILE);
        if(text == null) return null;
        this.uuid = text;
        return text;
    }
    
    //Reads main reports from file.
    private Reports readMainReports() {
        Log.v("Carat", "Reading main reports from disk");
        Object o = readObject(MAINFILE);
        if(o == null) return null;
        this.mainReports = new WeakReference<Reports>((Reports) o);
        return (Reports) o;
    }
    
    //Reads hog reports from file.
    private SimpleHogBug[] readHogReports() {
        Log.v("Carat", "Reading hog reports from disk");
        Object o = readObject(HOGFILE);
        if(o == null) return null;
        this.hogReports = new WeakReference<SimpleHogBug[]>((SimpleHogBug[]) o);
        return (SimpleHogBug[]) o;
    }
    
    //Reads bug reports from file.
    private SimpleHogBug[] readBugReports() {
        Log.v("Carat", "Reading bug reports from disk");
        Object o = readObject(BUGFILE);
        if(o == null) return null;
        this.bugReports = new WeakReference<SimpleHogBug[]>((SimpleHogBug[]) o);
        return (SimpleHogBug[]) o;
    }
    
    /**
     * Initializes uuid and writes it to a file.
     * @param uuid Uuid.
     */
    public void writeUuid(String uuid) {
        this.uuid = uuid;
        context.deleteFile(UUIDFILE);
        writeText(uuid, UUIDFILE);
    }

    /**
     * Creates a reference and writes main reports to a file.
     * @param reports Main reports.
     */
    public void writeMainReports(Reports reports) {
        mainReports = new WeakReference<Reports>(reports);
        writeObject(reports, MAINFILE);
    }

    /**
     * Creates a reference and writes hog reports to a file.
     * @param hogReports Hog reports.
     */
    public void writeHogReports(HogBugReport hogReports) {
        SimpleHogBug[] list = convertAndFilter(hogReports.getHbList(), false);
        if(list != null){
            this.hogReports = new WeakReference<SimpleHogBug[]>(list);
        }
        writeObject(list, HOGFILE);
    }

    /**
     * Creates a reference and writes bug reports to a file.
     * @param bugReports
     */
    public void writeBugReports(HogBugReport bugReports) {
        SimpleHogBug[] list = convertAndFilter(bugReports.getHbList(), true);
        if(list != null){
            this.bugReports = new WeakReference<SimpleHogBug[]>(list);
        }
        writeObject(list, BUGFILE);
    }

    
    // Write object to file
    private void writeObject(Object object, String fileName) {
        FileOutputStream out = openOutputStream(fileName);
        Log.v("Carat", "Writing data to "+fileName);
        try {
            ObjectOutputStream stream = new ObjectOutputStream(out);
            stream.writeObject(object);
            stream.close();
            //Try with resources handles closing
        } catch (Throwable e) {
            Log.v("Carat", "Failed writing object in "+fileName);
        }
    }
    
    // Write text to file
    private void writeText(String string, String fileName){
        FileOutputStream out = openOutputStream(fileName);
        try{
            DataOutputStream stream = new DataOutputStream(out);
            stream.writeUTF(string);
            stream.close();
        } catch(Throwable e){
            Log.v("Carat"," Failed writing text in "+fileName);
        }
    }

    // Read object from file
    private Object readObject(String fileName) {
        FileInputStream in = openInputStream(fileName);
        Log.v("Carat", "Reading from "+fileName);
        try {
            ObjectInputStream stream = new ObjectInputStream(in);
            Object object = stream.readObject();
            stream.close();
            return object;
        } catch (Throwable e) {
            Log.v("Carat", "Failed reading object from " + fileName);
        }
        return null;
    }
    
    // Read string from file
    private String readText(String fileName) {
        FileInputStream in = openInputStream(fileName);
        try {
            DataInputStream stream = new DataInputStream(in);
            String string = stream.readUTF();
            stream.close();
            return string;
        } catch (Throwable th){
            Log.v("Carat", "Failed reading text from " + fileName);
        }
        return null;
    }

    // Open outputstream for writing to file
    private FileOutputStream openOutputStream(String fileName) {
        try {
            return context.openFileOutput(fileName, Context.MODE_PRIVATE);
        } catch (FileNotFoundException e) {
            Log.v("Carat", "No report file to write to", e);
        } catch (Throwable e) {
            Log.v("Carat", "Failed opening " + fileName + " for writing");
        }
        return null;
    }

    // Open inputstream for reading from file
    private FileInputStream openInputStream(String fileName) {
        try {
            return context.openFileInput(fileName);
        } catch (FileNotFoundException e) {
            Log.v("Carat", "No reports to be read yet.");
        } catch (Throwable th) {
            Log.v("Carat", "Failed opening " + fileName + " for reading");
        }
        return null;
    }
    
    // Below are some utility methods that should be moved elsewhere

    // Convert HogsBugs list to SimpleHogBug list.
    // Set application label and icon.
    private SimpleHogBug[] convertAndFilter(List<HogsBugs> list, boolean isBug) {
        if (list == null) {
            return null;
        }

        List<SimpleHogBug> result = new LinkedList<SimpleHogBug>();
        int size = list.size();
        for (int i = 0; i < size; ++i) {
            
            HogsBugs item = list.get(i);
            String packageName = fixPackageName(item.getAppName());
            
            SimpleHogBug h = new SimpleHogBug(packageName, isBug ? 
                    Constants.Type.BUG : 
                    Constants.Type.HOG);
            
            // Device specific application icon and label
            h.setAppLabel(this.getApplicationLabel(packageName));
            h.setAppIcon(this.getApplicationIcon(packageName));
            
            String priority = item.getAppPriority();
            if (priority == null || priority.length() == 0) {
                priority = "Foreground app";
            }
            double error = item.getError();
            
            h.setAppPriority(priority);
            h.setExpectedValue(item.getExpectedValue());
            h.setExpectedValueWithout(item.getExpectedValueWithout());
            h.setwDistance(item.getWDistance());
            h.setError(item.getError());
            h.setErrorWithout(item.getErrorWithout());
            h.setSamples(item.getSamples());
            h.setSamplesWithout(item.getSamplesWithout());
            result.add(h);
        }
        return result.toArray(new SimpleHogBug[result.size()]);
    }
    
    /**
     * Return a human-readable application label from package name.
     * @param packageName Fixed package name
     * @return Application label if found, otherwise package name.
     * Null package names are returned with <i>Unknown</i> as label.
     */
    private String getApplicationLabel(String packageName){
        if(packageName == null) return "Unknown";
        try {
            ApplicationInfo info = pm.getApplicationInfo(packageName, 0);
            if(info !=null){
                return pm.getApplicationLabel(info).toString();
            } else return packageName; 
        } catch(NameNotFoundException e){
            return packageName;
        }
    }

    //Splits the string and returns everything before a colon
    private String fixPackageName(String name) {
        return (name == null)? null : name.split(":")[0];
    }
    
    /**
     * Return base64 encoded icon PNG from a package.
     * @param packageName Package name.
     * @return Base 64 encoded PNG or an empty string.
     */
    private String getApplicationIcon(String packageName){
        try{
            Drawable d = context.getPackageManager().getApplicationIcon(packageName);
            return "data:image/png;base64,"+ encodeIcon(d);
        } catch (PackageManager.NameNotFoundException e){
            return "";
        }
    }
    /**
     * Converts a drawable resource to a base64 encoded bitmap.
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
