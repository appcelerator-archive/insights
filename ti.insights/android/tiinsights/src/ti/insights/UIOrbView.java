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

public class UIOrbView extends TiUIView {
	KrollDict props;
	
	OrbView tiOrbView;
	
	// orb properties
	int currentPercent;
	boolean colorActive;
	
	ArrayList<Paint> circlesBase;
	ArrayList<Paint> circlesBg;
	ArrayList<Paint> circlesFull;
	
	Paint centerCircle;
	Paint centerCircleBg;
	
	Bitmap bg;
	RectF  rect;
	Canvas canvas;
	
	// many of these are constants... see iOS version...
	int width;
	int height;
	int scaleFactor;
	int minStrokeWidth;
	int maxStrokeWidth;
	int maxOrbs;
	int maxPercent;
	int minPercent;
	int orbOffset;
	int orbRadiusOffset;
	int centerCircleRadius;
	int centerCircleBgRadius;
	
	String centerOrbColor;
	String orbColorBase;
	String orbColorPositive;
	String orbColorNegative;
	String orbGray;

	public UIOrbView(TiViewProxy proxy) {
		super(proxy);
		
		tiOrbView = new OrbView(proxy.getActivity());
		
		props = proxy.getProperties();
				
		colorActive    = true;
		currentPercent = 0;
		scaleFactor    = tiOrbView.getResources().getDisplayMetrics().densityDpi / 160;
		
		width  = (props.containsKeyAndNotNull("width")) ? TiConvert.toInt(props.getString("width")) * scaleFactor : 0;
		height = (props.containsKeyAndNotNull("height")) ? TiConvert.toInt(props.getString("height")) * scaleFactor : 0;
		
		setCenterCircleRadius((props.containsKeyAndNotNull("centerCircleRadius")) ? TiConvert.toInt(props.getString("centerCircleRadius")) : 44 * scaleFactor);
		setCenterCircleBgRadius((props.containsKeyAndNotNull("centerCircleBgRadius")) ? TiConvert.toInt(props.getString("centerCircleBgRadius")) : 83 * scaleFactor);
		setMinStrokeWidth((props.containsKeyAndNotNull("minStrokeWidth")) ? TiConvert.toInt(props.getString("minStrokeWidth")) : 1 * scaleFactor); // orbs that haven't reached 100%
		setMaxStrokeWidth((props.containsKeyAndNotNull("maxStrokeWidth")) ? TiConvert.toInt(props.getString("maxStrokeWidth")) : 7 * scaleFactor); // orbs that have reached 100%
		setOrbOffest((props.containsKeyAndNotNull("orbOffset")) ? TiConvert.toInt(props.getString("orbOffset")) : 6 * scaleFactor); // how far apart should orbs be from one another
		setOrbRadiusOffset((props.containsKeyAndNotNull("orbRadiusOffset")) ? TiConvert.toInt(props.getString("orbRadiusOffset")) : 2 * scaleFactor); // how inward should the radius be compared to frame; stroke renders from center of path
		
		maxOrbs = 5; // number of orbs to render outside the center
		
		// we do not yet scale this value when rendering, which would be useful...
		maxPercent = 500;
		minPercent = -500;
		
		// define orb colors
		centerOrbColor   = "#f9f9f9";
		orbColorBase     = "#cccccc";
		orbColorPositive = "#00b1ff";
		orbColorNegative = "#ff0080";
		orbGray          = "#999999";
		
		circlesBase = new ArrayList<Paint>();
		circlesBg   = new ArrayList<Paint>();
		circlesFull = new ArrayList<Paint>();
		
		bg     = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
		canvas = new Canvas(bg);
								
		tiOrbView.setBackgroundDrawable(new BitmapDrawable(bg));
		
		setNativeView(tiOrbView);
	}
	
	private void setOrbRadiusOffset(int newOrbRadiusOffset) {
		orbRadiusOffset = newOrbRadiusOffset * scaleFactor;
	}
	
	private void setOrbOffest(int newOrbOffset) {
		orbOffset = newOrbOffset * scaleFactor;
	}
	
	private void setMaxStrokeWidth(int newMaxStrokeWidth) {
		maxStrokeWidth = newMaxStrokeWidth * scaleFactor;
	}
	
	private void setMinStrokeWidth(int newMinStrokeWidth) {
		minStrokeWidth = newMinStrokeWidth * scaleFactor;
	}
	
	private void setCenterCircleRadius(int newCenterCircleRadius) {
		centerCircleRadius = newCenterCircleRadius * scaleFactor;
	}
	
	private void setCenterCircleBgRadius(int newCenterCircleBgRadius) {
		centerCircleBgRadius = newCenterCircleBgRadius * scaleFactor;
	}
	
	private void renderCenterOrbs() {
		centerCircle   = new Paint();
		centerCircleBg = new Paint();
		
		centerCircle.setColor(TiConvert.toColor(centerOrbColor));
		centerCircle.setAntiAlias(true);
		centerCircle.setFilterBitmap(false);
		centerCircle.setStyle(Paint.Style.FILL);
		
		centerCircleBg.setColor(TiConvert.toColor(centerOrbColor));
		centerCircleBg.setAntiAlias(true);
		centerCircleBg.setFilterBitmap(false);
		centerCircleBg.setStyle(Paint.Style.FILL);
		centerCircleBg.setAlpha(51); // 0.2 double opacity
	
		canvas.drawCircle(width / 2, height / 2, centerCircleBgRadius, centerCircleBg);
		canvas.drawCircle(width / 2, height / 2, centerCircleRadius, centerCircle);
	}
	
	private void renderOrbs() {
		double  actualOrbCountFraction  = ((double)maxOrbs / ((currentPercent < 0) ? (double)(minPercent * -1) : (double)maxPercent) * ((currentPercent < 0) ? (double)(currentPercent * -1) : (double)currentPercent));
		int     actualOrbCount          = (int)(Math.ceil(actualOrbCountFraction)); // total orbs
		int     actualOrbCountFloor     = (int)(Math.floor(actualOrbCountFraction)); // total full orbs
		int     actualOrbCountRemainder = (int)(Math.ceil(actualOrbCountFraction % 1));
		
		int     actualPercent           = (int)(actualOrbCountFraction * 100);
		int     actualPercentFull       = (int)(actualOrbCountFraction * 100);
		int     actualPercentRemainder  = (int)((actualOrbCountFraction % 1) * 100);
		
		int     currentOrbCount         = 0;
		
		boolean goClockwise             = currentPercent > 0;
		int     baseCirc;
		
		clearCanvas();
		
		// first, render the center orbs (these are static)
		renderCenterOrbs();
		
		// this will only execute for the amount of full orbs we have
		for (int ifo = 0; ifo < actualOrbCountFloor; ifo ++) {
			// render the full orb
			circlesFull.add(new Paint());
			
			if (colorActive) {
				circlesFull.get(ifo).setColor(TiConvert.toColor((goClockwise) ? orbColorPositive : orbColorNegative));
			} else {
				circlesFull.get(ifo).setColor(TiConvert.toColor(orbGray));
			}
			
			circlesFull.get(ifo).setStrokeWidth(maxStrokeWidth); // when we reach 100% minStroke for less than
			circlesFull.get(ifo).setAntiAlias(true);
			circlesFull.get(ifo).setFilterBitmap(false);
			circlesFull.get(ifo).setStyle(Paint.Style.STROKE);
			
			canvas.drawCircle(width / 2, height / 2, (goClockwise) ? centerCircleBgRadius + (currentOrbCount * orbOffset) : centerCircleBgRadius - (currentOrbCount * orbOffset), circlesFull.get(ifo));
			
			currentOrbCount ++;
		}
		
		if (currentPercent > -500 && currentPercent < 500) {			
			// we always generate and render 1 orb if there is no fraction
			// this will not render if we do have a fraction...
			// otherwise, we render the next orb with a partial arc...
			if (actualOrbCountFraction % 1 == 0) {
				// this orb will only be the base
				circlesBase.add(new Paint());
				
				circlesBase.get(0).setColor(TiConvert.toColor(orbColorBase));
				circlesBase.get(0).setStrokeWidth(minStrokeWidth);
				circlesBase.get(0).setAntiAlias(true);
				circlesBase.get(0).setFilterBitmap(false);
				circlesBase.get(0).setStyle(Paint.Style.STROKE);
				
				canvas.drawCircle(width / 2, height / 2, (goClockwise) ? (centerCircleBgRadius + (currentOrbCount * maxStrokeWidth)) - minStrokeWidth : centerCircleBgRadius - (currentOrbCount * maxStrokeWidth), circlesBase.get(0));
			} else {
				// we will only render the base and arc
				circlesBase.add(new Paint());
				circlesBg.add(new Paint());
							
				circlesBase.get(0).setColor(TiConvert.toColor(orbColorBase));
				circlesBase.get(0).setStrokeWidth(minStrokeWidth);
				circlesBase.get(0).setAntiAlias(true);
				circlesBase.get(0).setFilterBitmap(false);
				circlesBase.get(0).setStyle(Paint.Style.STROKE);
				
				if (colorActive) {
					circlesBg.get(0).setColor(TiConvert.toColor((goClockwise) ? orbColorPositive : orbColorNegative));
				} else {
					circlesBg.get(0).setColor(TiConvert.toColor(orbGray));
				}
				
				circlesBg.get(0).setStrokeWidth(minStrokeWidth);
				circlesBg.get(0).setAntiAlias(true);
				circlesBg.get(0).setFilterBitmap(false);
				circlesBg.get(0).setStyle(Paint.Style.STROKE);
								
				baseCirc = ((goClockwise) ? (centerCircleBgRadius + (currentOrbCount * maxStrokeWidth)) - minStrokeWidth : centerCircleBgRadius - (currentOrbCount * maxStrokeWidth)) * 2;
				//float left, float top, float right, float bottom
				rect = new RectF((width - baseCirc) / 2, (height - baseCirc) / 2, ((width - baseCirc) / 2) + baseCirc, ((height - baseCirc) / 2) + baseCirc);
				
				canvas.drawCircle(width / 2, height / 2, (goClockwise) ? (centerCircleBgRadius + (currentOrbCount * maxStrokeWidth)) - minStrokeWidth : centerCircleBgRadius - (currentOrbCount * maxStrokeWidth), circlesBase.get(0));
				canvas.drawArc(rect, -90, (int)((actualPercentRemainder * 360) / 100) * ((goClockwise) ? 1 : -1), false, circlesBg.get(0));
			}
		}
		
		invalidateView();
	}
	
	private void invalidateView() {
		tiOrbView.postInvalidate();
	}
		
	private void clearCanvas() {
		canvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR);
	}
	
	public void setPercent(int newPercent) {
		// clear lists
		circlesBase.clear();
		circlesBg.clear();
		circlesFull.clear();
		
		// normalize out of range as we don't currently scale
		if (newPercent > maxPercent) {
			currentPercent = (int)(maxPercent);
		} else if (newPercent < minPercent) {
			currentPercent = (int)(minPercent);
		} else {
			currentPercent = newPercent;
		}
		
		renderOrbs();
	}
	
	public void showColor() {
		if (colorActive == false) {
			colorActive = true;
			renderOrbs();
		}
	}
	
	public void showGray() {
		if (colorActive == true) {
			colorActive = false;
			renderOrbs();
		}
	}
			
	public class OrbView extends View {
		
		public OrbView(Context context) {
			super(context);
		}
		
		@Override
		protected void onDraw(final Canvas canvas) {
			Log.d("OrbView", "Redrawing Orb View");
		}
		
	}
}