package ti.insights;

import android.graphics.Color;
import java.util.ArrayList;

import org.appcelerator.kroll.KrollDict;
import org.appcelerator.titanium.proxy.TiViewProxy;
import org.appcelerator.titanium.util.TiConvert;
import org.appcelerator.titanium.view.TiUIView;

import android.util.Log;
import android.view.View;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.PorterDuff;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.drawable.BitmapDrawable;

public class UIDonutView extends TiUIView {
	KrollDict props;
	
	// render to
	DonutView tiDonutView;
	
	// donut properties
	int segmentColor;
	int strokeWidthMax; // scale from this value
	int width;
	int height;
	int scaleFactor;
	
	// donut data
	ArrayList<Float> segmentStartAngles; // we only need the start angles to calculate the sweep and offset
	
	// graphic elements
	ArrayList<Paint> segmentPaint;
	Bitmap           bg;
	RectF            rect;
	Canvas           canvas;

	public UIDonutView(TiViewProxy proxy) {
		super(proxy);
		
		tiDonutView = new DonutView(proxy.getActivity());
		
		props = proxy.getProperties();
		
		scaleFactor = tiDonutView.getResources().getDisplayMetrics().densityDpi / 160;
		
		segmentStartAngles = new ArrayList<Float>();
		segmentPaint       = new ArrayList<Paint>();
		
		if (props.containsKeyAndNotNull("color")) {
			setColor(TiConvert.toColor(props.getString("color")));
		}
		
		setStrokeWidthMax((props.containsKeyAndNotNull("strokeWidthMax")) ? TiConvert.toInt(props.getString("strokeWidthMax")) : 50);		
		
		width  = (props.containsKeyAndNotNull("width")) ? TiConvert.toInt(props.getString("width")) * scaleFactor : 0;
		height = (props.containsKeyAndNotNull("height")) ? TiConvert.toInt(props.getString("height")) * scaleFactor : 0;
		
		bg     = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
		rect   = new RectF(strokeWidthMax / 2, strokeWidthMax / 2, width - (strokeWidthMax / 2), height - (strokeWidthMax / 2));
		canvas = new Canvas(bg);
		
		tiDonutView.setBackgroundDrawable(new BitmapDrawable(bg));
		
		setNativeView(tiDonutView);
	}
	
	private void renderSegments() {
		int     segmentLength;
		int     currentSweep;
		int     offset;
		boolean useOffset;
		Paint   currentPaint;
		float   currentAngle;
		float  	nextAngle;
		
		segmentLength = segmentStartAngles.size();
		offset        = 1;
		useOffset     = segmentLength > 1; // if number of segments is greater than one, use 1dp offset between segments
		
		clearCanvas();
		
		for (int pi = 0, pil = segmentLength; pi < pil; pi++) {
			segmentPaint.add(new Paint());
			
			currentPaint  = segmentPaint.get(pi);
			currentAngle  = segmentStartAngles.get(pi);
			nextAngle     = (pi == segmentLength - 1) ? 360 : segmentStartAngles.get(pi + 1);
			currentSweep  = ((Number)nextAngle).intValue() - ((Number)currentAngle).intValue();
			
			currentPaint.setColor(segmentColor);
			currentPaint.setStrokeWidth(((nextAngle - currentAngle) / 360) * strokeWidthMax); // we have to figure out what this will be based on number of segments
			currentPaint.setAntiAlias(true);
			currentPaint.setFilterBitmap(false);
			currentPaint.setStyle(Paint.Style.STROKE);
		    
			canvas.drawArc(rect, currentAngle - 90, (useOffset) ? currentSweep - offset : currentSweep, false, currentPaint);
		}
		
		invalidateView();
	}
	
	private void clearCanvas() {
		canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
	}
	
	private void setStrokeWidthMax(int newStrokeWidthMax) {
		strokeWidthMax = newStrokeWidthMax * scaleFactor;
	}
	
	private void invalidateView() {
		tiDonutView.postInvalidate();
	}
	
	public void setColor(int newColor) {
		segmentColor = newColor;
	}
	
	public void setData(Object newData) {
		Object[] newDataArray = (Object[]) newData;
		
		segmentStartAngles.clear();
		
		for (int i = 0; i < newDataArray.length; i++) {
			segmentStartAngles.add(TiConvert.toFloat(newDataArray[i]));
		}
		
		renderSegments();
	}
	
	public class DonutView extends View {
		
		public DonutView(Context context) {
			super(context);
		}
		
		@Override
		protected void onDraw(final Canvas canvas) {
			// step counters for animation...
			// Log.i("DonutView", "onDraw Called");
		}
		
	}
}
