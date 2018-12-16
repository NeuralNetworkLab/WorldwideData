#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import numpy as np
import pandas as pd

raw_data=pd.read_csv('data/countries_1990_2015.csv')
label_data=pd.read_csv('data/data_definition .csv')
label_data=label_data.sort_values(by=['Indicator Name'])
label_datas=label_data['Indicator Name']
print(label_datas)
# data_types=raw_data['Series Name'].unique()
# print(data_types)
i=0
for one_type in label_datas:
    sub_df = raw_data[raw_data['Series Name'] == one_type]
    sub_df.to_csv('data/feature'+str(i)+'.csv', index=False, header=True)
    i=i+1
label_data.to_csv('data/data_definition.csv', index=False, header=True)

country_data=raw_data.sort_values(['Country Name','Series Name'])
coutries=country_data['Country Name'].unique()

for country in coutries:
    sub_df = country_data[country_data['Country Name'] == country]
    sub_df.to_csv('data/countries/' + str(country) + '.csv', index=False, header=True)
    i = i + 1
