package com.bingovinilo.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(AbrirPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
