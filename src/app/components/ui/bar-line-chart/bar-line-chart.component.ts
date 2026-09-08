import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  BarVerticalComponent,
  Color,
  ColorHelper,
  DataItem,
  NgxChartsModule,
  ScaleType,
  Series,
  colorSets
} from '@swimlane/ngx-charts';

/** A drawn point of the overlay line, in chart coordinates. */
interface LineMarker {
  key: string;
  cx: number;
  cy: number;
}

/**
 * Vertical bars with a second series drawn as a line over the same categories.
 *
 * ngx-charts has no combo chart, and two stacked charts cannot be aligned: a
 * bar chart places categories on a band scale and a line chart on a point
 * scale, so the two grids drift apart. This extends `ngx-charts-bar-vertical`
 * instead and draws the line itself against the bars' own band scale, which
 * keeps every line point on the centre of its bar by construction and shares
 * one y domain between the two series.
 *
 * Inherited inputs (`results`, `scheme`, `xAxis`, `xAxisLabel`, ...) behave as
 * they do on `ngx-charts-bar-vertical`. With no `lineResults` the chart is that
 * bar chart, colour and all. Passing `lineResults` switches colour from meaning
 * "which category" to meaning "which series": every bar takes one colour, the
 * line takes another, a legend names them, and hovering shows both values for
 * the month under the cursor.
 *
 * The base class uses decorator inputs, so this one does too - signal inputs
 * cannot override inherited `@Input()`s.
 */
@Component({
  selector: 'app-bar-line-chart',
  templateUrl: './bar-line-chart.component.html',
  styleUrls: ['./bar-line-chart.component.css'],
  imports: [NgxChartsModule, DecimalPipe],
  // The tooltip body is rendered into ngx-charts' own overlay, outside this
  // component's DOM, so its styles cannot be scoped. Every selector in the
  // stylesheet is `wb-`-prefixed to keep that global reach harmless.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarLineChartComponent extends BarVerticalComponent {
  /**
   * The overlay series. Each point's `name` must be the bar category it sits
   * on - a point outside the bars' domain has nowhere to be drawn and is
   * dropped. Categories with no point leave a gap in the line rather than a
   * zero, so missing data does not read as no consumption.
   *
   * `extra.label` is shown in the tooltip beside the series name, for when the
   * point stands for something other than the category it is plotted against
   * (a previous year's month, say).
   */
  @Input() lineResults: DataItem[] = [];
  /** Legend and tooltip name for the bars. */
  @Input() barSeriesName = '';
  /** Legend and tooltip name for the line. */
  @Input() lineSeriesName = '';
  /** Appended to tooltip values, e.g. `kWh`. */
  @Input() unit = '';

  /** Colours by series name; drives the legend, the line and the tooltip. */
  seriesColors!: ColorHelper;
  /** `d` of the line, split into subpaths so gaps stay gaps. */
  linePath = '';
  lineMarkers: LineMarker[] = [];
  lineColor = '';
  /** Both series in the shape `ngx-charts-tooltip-area` expects. */
  tooltipResults: Series[] = [];
  /** The bars' band scale mapped to bar centres, for the line's hover anchor. */
  centeredXScale: (label: unknown) => number = () => 0;

  get hasLine(): boolean {
    return this.lineResults?.length > 0;
  }

  override update(): void {
    // The legend only earns its space once there are two series to tell apart.
    this.legend = this.hasLine;
    super.update();
    this.updateLine();
  }

  /** Widens the bars' y domain to cover the line, so neither series clips. */
  override getYDomain(): [number, number] {
    const [min, max] = super.getYDomain();
    if (!this.hasLine) {
      return [min, max];
    }
    const values = this.lineResults.map(d => d.value);
    return [Math.min(min, ...values), Math.max(max, ...values)];
  }

  override setColors(): void {
    if (!this.hasLine) {
      super.setColors();
      return;
    }
    const [barColor, lineColor] = this.seriesPalette();
    this.lineColor = lineColor;
    this.colors = new ColorHelper(this.palette([barColor]), ScaleType.Ordinal, this.xDomain, this.customColors);
    this.seriesColors = new ColorHelper(this.palette([barColor, lineColor]), ScaleType.Ordinal, [
      this.barSeriesName,
      this.lineSeriesName
    ]);
  }

  override getLegendOptions() {
    if (!this.hasLine) {
      return super.getLegendOptions();
    }
    return {
      scaleType: ScaleType.Ordinal,
      colors: this.seriesColors,
      domain: [this.barSeriesName, this.lineSeriesName],
      title: '',
      position: this.legendPosition
    };
  }

  /** Tooltip heading: the category the cursor is nearest to. */
  tooltipTitle(model: DataItem[]): string {
    return model?.length ? String(model[0].name) : '';
  }

  private updateLine(): void {
    if (!this.hasLine || !this.xScale || !this.yScale) {
      this.linePath = '';
      this.lineMarkers = [];
      this.tooltipResults = [];
      return;
    }

    const offset = this.xScale.bandwidth() / 2;
    this.centeredXScale = this.centerScale(offset);

    const commands: string[] = [];
    const markers: LineMarker[] = [];
    let connected = false;

    for (const label of this.xDomain) {
      const point = this.lineResults.find(d => String(d.name) === String(label));
      if (!point || point.value === null || point.value === undefined) {
        connected = false;
        continue;
      }
      const cx = this.xScale(label) + offset;
      const cy = this.yScale(point.value);
      commands.push(`${connected ? 'L' : 'M'}${cx},${cy}`);
      markers.push({ key: String(label), cx, cy });
      connected = true;
    }

    this.linePath = commands.join(' ');
    this.lineMarkers = markers;
    this.tooltipResults = [
      { name: this.barSeriesName, series: this.results },
      { name: this.lineSeriesName, series: this.lineResults }
    ];
  }

  /**
   * `ngx-charts-tooltip-area` only ever calls the scale as a function and asks
   * it for its domain, so a band scale shifted to bar centres is scale enough
   * to put the hover anchor over the bar the tooltip is describing.
   */
  private centerScale(offset: number): (label: unknown) => number {
    const band = this.xScale;
    const scale = (label: unknown) => band(label) + offset;
    (scale as { domain?: () => unknown[] }).domain = () => band.domain();
    return scale;
  }

  /** The first two entries of the configured scheme name the two series. */
  private seriesPalette(): [string, string] {
    const scheme = typeof this.scheme === 'string'
      ? colorSets.find(set => set.name === this.scheme)
      : this.scheme;
    const domain = scheme?.domain ?? [];
    return [domain[0] ?? '#3f51b5', domain[1] ?? '#e91e63'];
  }

  private palette(domain: string[]): Color {
    return { name: 'series', selectable: true, group: ScaleType.Ordinal, domain };
  }
}
