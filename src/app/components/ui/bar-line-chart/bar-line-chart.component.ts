import { ChangeDetectionStrategy, Component, Input, ViewEncapsulation } from '@angular/core';
import { DecimalPipe, PercentPipe } from '@angular/common';
import { BarVerticalComponent, DataItem, NgxChartsModule, Series } from '@swimlane/ngx-charts';

/** A drawn point of the reference line, in chart coordinates. */
interface LineMarker {
  key: string;
  cx: number;
  cy: number;
}

/**
 * Vertical bars with a reference series drawn as a line over the same
 * categories: the period being read, against the period it is measured against.
 *
 * ngx-charts has no combo chart, and two stacked charts cannot be aligned: a
 * bar chart places categories on a band scale and a line chart on a point
 * scale, so the two grids drift apart. This extends `ngx-charts-bar-vertical`
 * instead and draws the line itself against the bars' own band scale, which
 * keeps every line point on the centre of its bar by construction and shares
 * one y domain between the two series.
 *
 * Colour is not an input. The bars take `--color-chart-series` and the line
 * `--color-chart-reference`, applied through CSS because ngx-charts wants
 * colours as JS strings and could not follow the theme. The `scheme` this
 * inherits still feeds the library's colour helper - nothing on screen reads
 * the result. One series means one colour: twelve months in eight hues would
 * encode nothing.
 *
 * The base class uses decorator inputs, so this one does too - signal inputs
 * cannot override inherited `@Input()`s.
 */
@Component({
  selector: 'app-bar-line-chart',
  templateUrl: './bar-line-chart.component.html',
  styleUrls: ['./bar-line-chart.component.css'],
  imports: [NgxChartsModule, DecimalPipe, PercentPipe],
  // The tooltip body is rendered into ngx-charts' own overlay, outside this
  // component's DOM, so its styles cannot be scoped. Every selector in the
  // stylesheet is `wb-`-prefixed to keep that global reach harmless.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarLineChartComponent extends BarVerticalComponent {
  /**
   * The reference series. Each point's `name` must be the bar category it sits
   * on - a point outside the bars' domain has nowhere to be drawn and is
   * dropped. Categories with no point leave a gap in the line rather than a
   * zero, so missing data does not read as no consumption.
   *
   * `extra.label` is shown in the tooltip beside the series name, for when the
   * point stands for something other than the category it is plotted against
   * (a previous year's month, say).
   */
  @Input() lineResults: DataItem[] = [];
  /** Tooltip name for the bars. */
  @Input() barSeriesName = '';
  /** Tooltip name for the line. */
  @Input() lineSeriesName = '';
  /** Tooltip row label for the difference between the two, e.g. `Difference`. */
  @Input() deltaLabel = '';
  /** Appended to tooltip values, e.g. `kWh`. */
  @Input() unit = '';

  /** `d` of the line, split into subpaths so gaps stay gaps. */
  linePath = '';
  lineMarkers: LineMarker[] = [];
  /** Both series in the shape `ngx-charts-tooltip-area` expects. */
  tooltipResults: Series[] = [];
  /** The bars' band scale mapped to bar centres, for the line's hover anchor. */
  centeredXScale: (label: unknown) => number = () => 0;

  get hasLine(): boolean {
    return this.lineResults?.length > 0;
  }

  override update(): void {
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

  /** Tooltip heading: the category the cursor is nearest to. */
  tooltipTitle(model: DataItem[]): string {
    return model?.length ? String(model[0].name) : '';
  }

  /**
   * How far the read period sits above or below its reference, as a ratio.
   * Null when the month is missing from either series, or when the reference
   * is zero and the change has no percentage to express.
   */
  tooltipDelta(model: DataItem[]): number | null {
    if (model?.length !== 2) {
      return null;
    }
    const [current, reference] = model;
    return reference.value ? (current.value - reference.value) / reference.value : null;
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
}
