package com.raonworks.apps;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;

import androidx.annotation.Nullable;

public class AudioPlaybackService extends Service {
    private static final String CHANNEL_ID = "audio_playback";
    private static final int NOTIFICATION_ID = 1001;
    public static final String ACTION_MEDIA_CONTROL = "com.raonworks.apps.MEDIA_CONTROL";
    public static final String EXTRA_MEDIA_ACTION = "mediaAction";
    public static final String EXTRA_COMMAND = "command";
    public static final String COMMAND_PAUSE = "pause";

    private MediaSession mediaSession;
    private boolean isPlaying = true;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();

        mediaSession = new MediaSession(this, "PopoKoolKool");
        mediaSession.setFlags(
            MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS
        );
        mediaSession.setPlaybackState(new PlaybackState.Builder()
            .setState(PlaybackState.STATE_PLAYING, 0, 1.0f)
            .setActions(
                PlaybackState.ACTION_PLAY
                    | PlaybackState.ACTION_PAUSE
                    | PlaybackState.ACTION_STOP
            )
            .build());
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                updatePlaybackState(true);
                broadcastMediaAction("play");
            }

            @Override
            public void onPause() {
                updatePlaybackState(false);
                broadcastMediaAction("pause");
            }

            @Override
            public void onStop() {
                updatePlaybackState(false);
                broadcastMediaAction("stop");
            }
        });
        mediaSession.setActive(true);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(),
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
            );
        } else {
            startForeground(NOTIFICATION_ID, buildNotification());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null && COMMAND_PAUSE.equals(intent.getStringExtra(EXTRA_COMMAND))) {
            updatePlaybackState(false);
        }
        return START_STICKY;
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onDestroy() {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
        }
        stopForeground(STOP_FOREGROUND_REMOVE);
        super.onDestroy();
    }

    private Notification buildNotification() {
        Intent launchIntent = getPackageManager().getLaunchIntentForPackage(getPackageName());
        PendingIntent contentIntent = launchIntent == null
            ? null
            : PendingIntent.getActivity(
                this,
                0,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

        Notification.Builder builder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
            ? new Notification.Builder(this, CHANNEL_ID)
            : new Notification.Builder(this);

        builder
            .setContentTitle("포포의 쿨쿨")
            .setContentText(isPlaying ? "수면 사운드 재생 중" : "수면 사운드 일시정지")
            .setSubText("POPO KOOLKOOL")
            .setSmallIcon(com.raonworks.apps.R.drawable.ic_notification)
            .setLargeIcon(BitmapFactory.decodeResource(getResources(), com.raonworks.apps.R.mipmap.ic_launcher))
            .setColor(Color.rgb(214, 170, 121))
            .setColorized(false)
            .setOngoing(true)
            .setCategory(Notification.CATEGORY_TRANSPORT)
            .setPriority(Notification.PRIORITY_LOW)
            .setShowWhen(false)
            .setVisibility(Notification.VISIBILITY_PUBLIC);

        if (contentIntent != null) builder.setContentIntent(contentIntent);
        if (mediaSession != null) builder.setStyle(new Notification.MediaStyle()
            .setMediaSession(mediaSession.getSessionToken()));

        return builder.build();
    }

    private void updatePlaybackState(boolean playing) {
        isPlaying = playing;
        if (mediaSession != null) {
            mediaSession.setPlaybackState(new PlaybackState.Builder()
                .setState(
                    playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                    0,
                    playing ? 1.0f : 0.0f
                )
                .setActions(
                    PlaybackState.ACTION_PLAY
                        | PlaybackState.ACTION_PAUSE
                        | PlaybackState.ACTION_STOP
                )
                .build());
        }

        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.notify(NOTIFICATION_ID, buildNotification());
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;

        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "수면 사운드 재생",
            NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription("백그라운드 수면 사운드 재생 상태");
        NotificationManager manager = getSystemService(NotificationManager.class);
        if (manager != null) manager.createNotificationChannel(channel);
    }

    private void broadcastMediaAction(String action) {
        Intent intent = new Intent(ACTION_MEDIA_CONTROL);
        intent.setPackage(getPackageName());
        intent.putExtra(EXTRA_MEDIA_ACTION, action);
        sendBroadcast(intent);
    }
}
