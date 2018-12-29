#coding:utf-8

import pandas as pd
import numpy as np 
from sklearn.preprocessing import MinMaxScaler
import os

path = 'C:\\Users\\xinch\\Desktop\\WorldwideData\\data'
init_features = os.listdir(path)
features = init_features[4:]

for i in range(len(features)):
	print features[i],
	filename = os.path.join(path,features[i])
	data = pd.read_csv(filename,header=1)
	np_data = np.array(data)
	dataset = np_data[:,4:]
	# print dataset
	x = np.argwhere(dataset=='..')
	for j in x:
		dataset[j[0]][j[1]]=0.0
	dataset = dataset.astype(float)
	m = np.mean(dataset)
	mx = dataset.max()
	mn = dataset.min()
	print mx,mn
	for o in range(dataset.shape[0]):
		for p in range(dataset.shape[1]):
			dataset[o][p] = (float(dataset[o][p])-mn)/(mx-mn)
	np_data[:,4:]=dataset
	df = pd.DataFrame(np_data)
	df.to_csv('.\\prefeatures\\'+features[i],index=False,header=1)