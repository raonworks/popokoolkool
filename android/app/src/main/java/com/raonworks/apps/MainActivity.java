package com.raonworks.apps;

import android.os.Bundle;
import android.webkit.WebView;

import androidx.annotation.Nullable;

import com.getcapacitor.BridgeActivity;

import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
	private static final String DEV_SERVER_URL = "http://172.16.0.130:5173/";
	private static final int CONNECTION_TIMEOUT_MS = 1500;

	private final ExecutorService serverCheckExecutor = Executors.newSingleThreadExecutor();

	@Override
	public void onCreate(@Nullable Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		WebView webView = getBridge().getWebView();
		serverCheckExecutor.execute(() -> {
			if (!isServerAvailable()) {
				return;
			}

			webView.post(() -> webView.loadUrl(DEV_SERVER_URL));
		});
	}

	private boolean isServerAvailable() {
		HttpURLConnection connection = null;

		try {
			connection = (HttpURLConnection) new URL(DEV_SERVER_URL).openConnection();
			connection.setConnectTimeout(CONNECTION_TIMEOUT_MS);
			connection.setReadTimeout(CONNECTION_TIMEOUT_MS);
			connection.setRequestMethod("GET");
			connection.setInstanceFollowRedirects(true);

			int responseCode = connection.getResponseCode();
			return responseCode >= 200 && responseCode < 400;
		} catch (IOException exception) {
			return false;
		} finally {
			if (connection != null) {
				connection.disconnect();
			}
		}
	}

	@Override
	public void onDestroy() {
		serverCheckExecutor.shutdownNow();
		super.onDestroy();
	}
}
