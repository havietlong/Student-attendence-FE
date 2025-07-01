import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dynamic-table-filter',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dynamic-table-filter.component.html',
  styleUrl: './dynamic-table-filter.component.css'
})
export class DynamicTableFilterComponent implements OnChanges {
  @Input() filterConfig: { key: string, label: string }[] = [];

  @Input() data: any[] = [];
  @Output() filtered = new EventEmitter<any[]>();

  tableAttributes: string[] = [];
  selectedFilters: { [key: string]: any } = {};
  activeAttributes: string[] = [];

  selectedAttribute: string = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.data.length > 0) {
      console.log('here');
      
      this.tableAttributes = Object.keys(this.flattenObject(this.data[0]));
      this.onFilterChange(); // Emit initial unfiltered data
    }
  }

  getLabel(attr: string): string {
    return this.filterConfig.find(f => f.key === attr)?.label || attr;
  }

  flattenObject(obj: any, parentKey = '', result: any = {}): any {
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        let propName = parentKey ? `${parentKey}.${key}` : key;
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          this.flattenObject(obj[key], propName, result);
        } else {
          result[propName] = obj[key];
        }
      }
    }
    return result;
  }

  getFilterOptions(attribute: string): any[] {
    const parts = attribute.split('.');
    const values = this.data.map(item => {
      let value = item;
      for (let part of parts) {
        value = value ? value[part] : undefined;
      }
      return value;
    }).filter(val => val !== undefined && val !== null);

    return [...new Set(values)];
  }

  // addAttribute() {
  //   if (this.selectedAttribute && !this.activeAttributes.includes(this.selectedAttribute)) {
  //     this.activeAttributes.push(this.selectedAttribute);
  //     this.selectedFilters[this.selectedAttribute] = '';
  //     this.selectedAttribute = '';
  //   }
  // }

  removeAttribute(attr: string) {
    delete this.selectedFilters[attr];
    this.activeAttributes = this.activeAttributes.filter(a => a !== attr);
    this.onFilterChange();
  }

  onFilterChange() {
    const filteredData = this.data.filter(item => {
      return this.activeAttributes.every(attr => {
        if (!this.selectedFilters[attr]) return true;

        const parts = attr.split('.');
        let value = item;
        for (let part of parts) {
          value = value ? value[part] : undefined;
        }

        return value === this.selectedFilters[attr];
      });
    });
    console.log('here', filteredData);
    
    this.filtered.emit(filteredData);
  }

  clearAll() {
    this.selectedFilters = {};
    this.activeAttributes = [];
    this.onFilterChange();
  }

  showAttributeSelector: boolean = false;

  addAttribute() {
    if (this.selectedAttribute && !this.activeAttributes.includes(this.selectedAttribute)) {
      this.activeAttributes.push(this.selectedAttribute);
      this.selectedFilters[this.selectedAttribute] = '';
      this.selectedAttribute = '';
      this.showAttributeSelector = false; // Hide selector after adding
    }
  }

  cancelAdd() {
    this.selectedAttribute = '';
    this.showAttributeSelector = false;
  }

}