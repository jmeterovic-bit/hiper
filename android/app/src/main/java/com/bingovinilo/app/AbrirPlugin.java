package com.bingovinilo.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.net.Uri;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.List;

// Abre un enlace con Android y dice qué apps lo pueden recibir (para saber si la app de Hitster lo toma).
@CapacitorPlugin(name = "Abrir")
public class AbrirPlugin extends Plugin {

    @PluginMethod
    public void enlace(PluginCall call) {
        String url = call.getString("url");
        String pkg = call.getString("paquete");
        if (url == null) { call.reject("Falta el enlace"); return; }
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.addCategory(Intent.CATEGORY_BROWSABLE);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        if (pkg != null && !pkg.isEmpty()) intent.setPackage(pkg);

        JSArray apps = new JSArray();
        PackageManager pm = getContext().getPackageManager();
        List<ResolveInfo> list = pm.queryIntentActivities(intent, PackageManager.MATCH_ALL);
        for (ResolveInfo ri : list) apps.put(ri.activityInfo.packageName);

        JSObject ret = new JSObject();
        ret.put("apps", apps);
        try {
            try {
                getContext().startActivity(intent);
            } catch (ActivityNotFoundException e) {
                // Segundo intento sin la categoría BROWSABLE.
                intent.removeCategory(Intent.CATEGORY_BROWSABLE);
                getContext().startActivity(intent);
            }
            ret.put("abierto", true);
        } catch (ActivityNotFoundException e) {
            ret.put("abierto", false);
            ret.put("error", "ninguna app");
        } catch (Exception e) {
            ret.put("abierto", false);
            ret.put("error", e.getClass().getSimpleName() + ": " + e.getMessage());
        }
        call.resolve(ret);
    }
}
