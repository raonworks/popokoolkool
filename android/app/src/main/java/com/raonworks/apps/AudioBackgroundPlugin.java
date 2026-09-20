package com.raonworks.apps;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.JSObject;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioBackground")
public class AudioBackgroundPlugin extends Plugin {
    private final BroadcastReceiver mediaActionReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            JSObject data = new JSObject();
            data.put("action", intent.getStringExtra(AudioPlaybackService.EXTRA_MEDIA_ACTION));
            notifyListeners("mediaAction", data);
        }
    };

    @Override
    public void load() {
        super.load();
        IntentFilter filter = new IntentFilter(AudioPlaybackService.ACTION_MEDIA_CONTROL);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            getContext().registerReceiver(mediaActionReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            getContext().registerReceiver(mediaActionReceiver, filter);
        }
    }

    @PluginMethod
    public void start(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), AudioPlaybackService.class);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), AudioPlaybackService.class);
        serviceIntent.putExtra(AudioPlaybackService.EXTRA_COMMAND, AudioPlaybackService.COMMAND_PAUSE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }

        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        getContext().unregisterReceiver(mediaActionReceiver);
        super.handleOnDestroy();
    }
}
