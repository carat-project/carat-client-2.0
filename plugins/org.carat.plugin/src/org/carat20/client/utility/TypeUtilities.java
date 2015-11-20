package org.carat20.client.utility;

import android.graphics.Bitmap;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.util.Base64;
import java.io.ByteArrayOutputStream;

public class TypeUtilities {
    /**
     * Converts a drawable resource to a bitmap.
     * @param image Drawable image
     * @return Bitmap
     */
    public static Bitmap getBitmap(Drawable image){
            if(image == null) return null;
            BitmapDrawable bmDrawable = ((BitmapDrawable) image);
            return bmDrawable.getBitmap();
    }
    
    /**
     * Compresses and scales a bitmap encoding it base64.
     * Negative and zero rescaling values are ignored.
     * @param bitmap Bitmap
     * @param width Rescale width
     * @param height Rescale height
     * @return Base64 encoded bitmap
     */
    public static String bitmapToBase64(Bitmap bitmap, int width, int height){
        if(bitmap == null) return "";
        if(width > 0 && height > 0){
            bitmap = Bitmap.createScaledBitmap(bitmap, width, height, true);
        }
        ByteArrayOutputStream outStream = new ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.PNG, 100, outStream);
        byte[] bitmapByte = outStream.toByteArray();
        String base64 = Base64.encodeToString(bitmapByte,Base64.DEFAULT);
        
        return "data:image/png;base64,"+ base64;
    }
    
    /**
     * @param string Input string
     * @return True if string is an integer
     */
    public static boolean isInteger(String string) {
        try {
            Integer.valueOf(string.trim());
            return true;
        } catch (NumberFormatException n) {
            return false;
        }
    }
}
